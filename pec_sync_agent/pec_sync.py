#!/usr/bin/env python3
"""
ERSUS360 Sync Agent — e-SUS PEC → ERSUS360
Versão: 1.2.0 | Apuí/AM | IBGE 1300144

Instalar no servidor onde o e-SUS PEC está rodando.
Conecta ao banco PostgreSQL local do PEC (sem exposição à internet),
busca TODAS as equipes ativas do município automaticamente (eSF, eSFR, eSB, eMulti...),
calcula os indicadores C1–C7/R1–R6 por equipe e envia para o ERSUS360 na nuvem.

Uso:
  python pec_sync.py            — modo contínuo (a cada 4h)
  python pec_sync.py --once     — sincroniza uma vez e sai
  python pec_sync.py --test     — testa conexão com o PEC sem enviar dados
"""

import os
import sys
import json
import logging
import time
from datetime import datetime, date, timedelta
from pathlib import Path

# Carrega .env se existir (sem depender de python-dotenv)
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ[_k.strip()] = _v.strip()

import psycopg2
import psycopg2.extras
import requests
import schedule

# ═══════════════════════════════════════════════════════════════════
#  CONFIGURAÇÃO — preencher antes de rodar
# ═══════════════════════════════════════════════════════════════════

# Banco PostgreSQL do e-SUS PEC (rede local — sem firewall)
PEC_DB_HOST = os.getenv("PEC_DB_HOST", "localhost")
PEC_DB_PORT = int(os.getenv("PEC_DB_PORT", "5433"))  # 5433 = PostgreSQL embutido do e-SUS PEC
PEC_DB_NAME = os.getenv("PEC_DB_NAME", "esus")      # ajustar se diferente
PEC_DB_USER = os.getenv("PEC_DB_USER", "esus")      # usuário PostgreSQL
PEC_DB_PASS = os.getenv("PEC_DB_PASS", "")          # senha PostgreSQL

# ERSUS360 — receptor na nuvem
ERSUS_URL   = "https://ersus360-production.up.railway.app"
ERSUS_KEY   = os.getenv("ERSUS_SYNC_KEY", "")       # chave gerada pelo ERSUS360

# Município
IBGE = "1300144"
# INE_EQUIPES não é mais necessário — equipes são buscadas automaticamente do PEC

# Intervalo de sincronização (horas)
SYNC_INTERVAL_HOURS = 4

# ═══════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("pec_sync.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("pec_sync")


def conectar_pec():
    """Abre conexão com o PostgreSQL local do PEC."""
    return psycopg2.connect(
        host=PEC_DB_HOST,
        port=PEC_DB_PORT,
        dbname=PEC_DB_NAME,
        user=PEC_DB_USER,
        password=PEC_DB_PASS,
        connect_timeout=10,
        options="-c client_encoding=UTF8",
    )


def competencia_atual() -> str:
    """Retorna competência no formato YYYY-MM (mês atual)."""
    hoje = date.today()
    return f"{hoje.year}-{hoje.month:02d}"


def buscar_equipes(conn) -> list[dict]:
    """
    Busca TODAS as equipes ativas do município no banco do PEC.
    Retorna lista de dicts: {ine, nome, tipo}
    Tipos mapeados: eSF, eSFR, eSB, eMulti, eCR, eAPP
    """
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Query padrão e-SUS PEC — tabela de equipes ativas
        cur.execute("""
            SELECT
                e.nu_ine                           AS ine,
                COALESCE(e.no_equipe, e.nu_ine)    AS nome,
                COALESCE(e.tp_equipe::text, 'eSF')  AS tipo,
                e.co_seq_equipe                    AS id
            FROM tb_equipe e
            WHERE e.st_ativo = 1
              AND e.nu_ine IS NOT NULL
            ORDER BY e.tp_equipe, e.no_equipe
        """)
        rows = cur.fetchall()

        if not rows:
            # Fallback: tentar sem filtro (schema alternativo)
            cur.execute("""
                SELECT
                    nu_ine        AS ine,
                    COALESCE(no_equipe, nu_ine) AS nome,
                    COALESCE(tp_equipe::text, 'eSF')  AS tipo,
                    co_seq_equipe AS id
                FROM tb_equipe
                WHERE st_ativo = 1
                  AND nu_ine IS NOT NULL
                ORDER BY tp_equipe, no_equipe
            """)
            rows = cur.fetchall()

        equipes = [dict(r) for r in rows]

        if not equipes:
            raise ValueError("tb_equipe vazia — PEC ainda não configurado com equipes")

        log.info("Equipes encontradas no PEC: %d", len(equipes))
        for eq in equipes:
            log.info("  [%s] %s — INE %s", eq["tipo"], eq["nome"], eq["ine"])
        return equipes

    except Exception as exc:
        log.error("Erro ao buscar equipes: %s", exc)
        # Fallback com as 9 equipes eSF conhecidas de Apuí/AM
        log.warning("Usando lista de fallback das 9 equipes eSF de Apuí/AM")
        return [
            {"ine": "0000407492", "nome": "CACHOEIRA",     "tipo": "eSF"},
            {"ine": "0000407506", "nome": "SÃO SEBASTIÃO", "tipo": "eSF"},
            {"ine": "0000407514", "nome": "ACARI",         "tipo": "eSF"},
            {"ine": "0000407522", "nome": "TRÊS ESTADOS",  "tipo": "eSF"},
            {"ine": "0000407530", "nome": "JUMA",          "tipo": "eSF"},
            {"ine": "0000407549", "nome": "LIBERDADE",     "tipo": "eSF"},
            {"ine": "0000407557", "nome": "KENNEDY",       "tipo": "eSF"},
            {"ine": "0000407565", "nome": "JK",            "tipo": "eSF"},
            {"ine": "0000407573", "nome": "ESTRADA NOVA",  "tipo": "eSF"},
        ]
    finally:
        cur.close()


def calcular_indicadores(conn, competencia: str, ine: str) -> dict:
    """
    Calcula indicadores C1-C7 para uma equipe numa competencia.

    Retorna dicionario {C1: pct, ...} apenas com o que foi possivel calcular
    com confianca no schema real (confirmado em colunas_tabelas.txt de
    18/09/2026). Este banco usa o esquema de FATOS/dimensoes do e-SUS PEC 5.x
    (tabelas tb_fat_*/tb_dim_*), diferente do esquema OLTP simples assumido
    na versao anterior deste arquivo.

    C1 e C5 (hipertensao/CIAP) estao mapeados e confirmados.
    C2, C3, C4, C6, C7 ainda NAO estao mapeados neste schema (pre-natal,
    exames e avaliacao do idoso usam tabelas tb_prontuario/tb_mchat/
    tb_requisicao_exame cujo caminho de juncao ate cidadao/equipe ainda
    nao foi confirmado) — propositalmente omitidos em vez de arriscar um
    numero errado. Ver ARQUITETURA.md / pedir ao DBA a juncao correta.
    """
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    ano, mes = int(competencia[:4]), int(competencia[5:])
    fim   = date(ano, mes, 28)
    ini6  = fim - timedelta(days=182)
    ini12 = fim - timedelta(days=365)

    result = {}

    try:
        # Resolve o id interno (dimensao) da equipe a partir do INE
        cur.execute("""
            SELECT co_seq_dim_equipe FROM tb_dim_equipe
            WHERE nu_ine = %s AND st_registro_valido = 1
        """, (ine,))
        row = cur.fetchone()
        if not row:
            log.warning("INE %s nao encontrado em tb_dim_equipe", ine)
            return {}
        co_equipe = row["co_seq_dim_equipe"]

        # ── C1: HAS (CIAP K86/K87/K85) com >= 1 consulta nos ultimos 12 meses ──
        cur.execute("""
            WITH has_equipe AS (
                SELECT DISTINCT p.nu_cns
                FROM tb_fat_atd_ind_problemas p
                JOIN tb_dim_ciap c ON c.co_seq_dim_ciap = p.co_dim_ciap
                LEFT JOIN tb_dim_situacao_problema sp
                       ON sp.co_seq_dim_situacao = p.co_dim_situacao_problema
                WHERE c.nu_ciap IN ('K86','K87','K85')
                  AND (sp.ds_situacao_problema ILIKE %s OR p.co_dim_situacao_problema IS NULL)
                  AND (p.co_dim_equipe_1 = %s OR p.co_dim_equipe_2 = %s)
                  AND p.nu_cns IS NOT NULL
            ),
            com_consulta AS (
                SELECT DISTINCT a.nu_cns
                FROM tb_fat_atendimento_individual a
                JOIN has_equipe h ON h.nu_cns = a.nu_cns
                WHERE a.dt_inicial_atendimento BETWEEN %s AND %s
            )
            SELECT
                (SELECT COUNT(*) FROM has_equipe)   AS den,
                (SELECT COUNT(*) FROM com_consulta) AS num
        """, ("%ativo%", co_equipe, co_equipe, ini12, fim))
        row = cur.fetchone()
        if row and row["den"]:
            result["C1"] = round(row["num"] / row["den"] * 100, 1)

        # ── C5: HAS com PA aferida nos ultimos 6 meses ──────────────────────
        cur.execute("""
            WITH has_equipe AS (
                SELECT DISTINCT p.nu_cns
                FROM tb_fat_atd_ind_problemas p
                JOIN tb_dim_ciap c ON c.co_seq_dim_ciap = p.co_dim_ciap
                LEFT JOIN tb_dim_situacao_problema sp
                       ON sp.co_seq_dim_situacao = p.co_dim_situacao_problema
                WHERE c.nu_ciap IN ('K86','K87','K85')
                  AND (sp.ds_situacao_problema ILIKE %s OR p.co_dim_situacao_problema IS NULL)
                  AND (p.co_dim_equipe_1 = %s OR p.co_dim_equipe_2 = %s)
                  AND p.nu_cns IS NOT NULL
            ),
            com_pa AS (
                SELECT DISTINCT a.nu_cns
                FROM tb_fat_atendimento_individual a
                JOIN has_equipe h ON h.nu_cns = a.nu_cns
                WHERE a.dt_inicial_atendimento BETWEEN %s AND %s
                  AND a.nu_pressao_sistolica IS NOT NULL
            )
            SELECT
                (SELECT COUNT(*) FROM has_equipe) AS den,
                (SELECT COUNT(*) FROM com_pa)     AS num
        """, ("%ativo%", co_equipe, co_equipe, ini6, fim))
        row = cur.fetchone()
        if row and row["den"]:
            result["C5"] = round(row["num"] / row["den"] * 100, 1)

        # ── C2, C3, C4, C6, C7: schema ainda nao mapeado neste PEC ──────────
        # C2 (desenvolvimento infantil), C6 (avaliacao multidimensional idoso):
        #   as colunas assumidas (st_avaliacao_desenvolvimento,
        #   st_avaliacao_multidimensional) nao existem em
        #   tb_fat_atendimento_individual neste banco.
        # C3 (pre-natal): tb_pre_natal/tb_atend_prof_pre_natal nao tem link
        #   direto e confirmado ate cidadao/equipe neste schema.
        # C4 (HbA1c): tb_requisicao_exame/tb_exame_requisitado ligam ao
        #   atendimento profissional (co_atend_prof), nao diretamente ao
        #   cidadao/CPF/CNS — falta confirmar essa tabela intermediaria.
        for c in ("C2", "C3", "C4", "C6", "C7"):
            log.debug("  %s nao calculado — schema pendente de mapeamento", c)

    except Exception as exc:
        log.warning("Erro ao calcular indicadores para INE %s: %s", ine, exc)
        conn.rollback()
    finally:
        cur.close()

    return result


def explorar_schema(conn):
    """
    Roda ao iniciar para ajudar o DBA a confirmar os nomes corretos das tabelas.
    Salva em schema_pec.txt.
    """
    cur = conn.cursor()
    cur.execute("""
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog','information_schema')
          AND (table_name ILIKE '%atendimento%'
            OR table_name ILIKE '%cidadao%'
            OR table_name ILIKE '%equipe%'
            OR table_name ILIKE '%pre_natal%'
            OR table_name ILIKE '%exame%'
            OR table_name ILIKE '%siaps%'
            OR table_name ILIKE '%indicador%')
        ORDER BY 1, 2
    """)
    rows = cur.fetchall()
    cur.close()
    with open("schema_pec.txt", "w", encoding="utf-8") as f:
        f.write("TABELAS RELEVANTES ENCONTRADAS NO BANCO DO PEC\n")
        f.write("=" * 60 + "\n")
        for schema, table in rows:
            f.write(f"  {schema}.{table}\n")
    log.info("Schema explorado — veja schema_pec.txt para confirmar nomes das tabelas.")


def sincronizar():
    """Executa uma rodada completa de sincronização."""
    comp = competencia_atual()
    log.info("⟳ Iniciando sincronização — competência %s", comp)

    try:
        conn = conectar_pec()
        log.info("✓ Conectado ao PostgreSQL do PEC")
    except Exception as exc:
        log.error("✗ Falha ao conectar ao PEC: %s", exc)
        return

    equipes = buscar_equipes(conn)

    payload = {
        "competencia": comp,
        "ibge": IBGE,
        "timestamp": datetime.utcnow().isoformat(),
        "equipes": {},       # { nome: { C1: pct, ... } }
        "tipos_equipe": {},  # { nome: "eSF" | "eSFR" | "eSB" | ... }
    }

    for eq in equipes:
        ine  = eq["ine"]
        nome = eq["nome"]
        tipo = eq.get("tipo", "eSF")
        inds = calcular_indicadores(conn, comp, ine)
        if inds:
            payload["equipes"][nome]      = inds
            payload["tipos_equipe"][nome] = tipo
            log.info("  [%s] %s → %s", tipo, nome, inds)
        else:
            log.warning("  [%s] %s → sem dados calculados", tipo, nome)

    conn.close()

    if not payload["equipes"]:
        log.warning("Nenhum dado calculado — sincronização abortada.")
        return

    # Salva cópia local como backup
    with open(f"sync_backup_{comp.replace('-','')}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Envia para ERSUS360
    try:
        resp = requests.post(
            f"{ERSUS_URL}/api/pec/sync",
            json=payload,
            headers={
                "X-Sync-Key": ERSUS_KEY,
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        if resp.status_code == 200:
            log.info("✓ Dados enviados ao ERSUS360: %s", resp.json())
        else:
            log.error("✗ ERSUS360 retornou %d: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        log.error("✗ Falha ao enviar para ERSUS360: %s", exc)


def modo_teste():
    """Verifica conexão e lista equipes sem enviar dados ao ERSUS360."""
    log.info("═" * 60)
    log.info("ERSUS360 Sync Agent — MODO TESTE")
    log.info("PEC: %s:%d/%s  usuário=%s", PEC_DB_HOST, PEC_DB_PORT, PEC_DB_NAME, PEC_DB_USER)
    log.info("═" * 60)

    # 1. Testa conexão com o PEC
    try:
        conn = conectar_pec()
        log.info("✓ Conexão com o PostgreSQL do PEC bem-sucedida!")
    except Exception as exc:
        log.error("✗ Falha ao conectar ao PEC: %s", exc)
        log.error("")
        log.error("Dicas:")
        log.error("  • Verifique se o e-SUS PEC está rodando (http://localhost:8080/esus)")
        log.error("  • Confira host/porta no .env (padrão: localhost:5433)")
        log.error("  • Verifique usuário e senha do banco")
        sys.exit(1)

    # 2. Explora schema
    explorar_schema(conn)
    log.info("✓ Schema explorado — veja schema_pec.txt")

    # 3. Lista equipes encontradas
    equipes = buscar_equipes(conn)
    if equipes:
        log.info("✓ %d equipe(s) ativa(s) encontrada(s):", len(equipes))
        for eq in equipes:
            log.info("    [%s] %s — INE: %s", eq.get("tipo","?"), eq.get("nome","?"), eq.get("ine","?"))
    else:
        log.warning("⚠ Nenhuma equipe ativa encontrada para IBGE %s", IBGE)
        log.warning("  Configure a UBS e equipes em http://localhost:8080/esus")

    conn.close()

    # 4. Testa conexão com ERSUS360
    if ERSUS_KEY:
        try:
            resp = requests.get(f"{ERSUS_URL}/api/pec/status", timeout=10)
            if resp.status_code == 200:
                log.info("✓ ERSUS360 acessível: %s", resp.json().get("status","ok"))
            else:
                log.warning("⚠ ERSUS360 respondeu %d", resp.status_code)
        except Exception as exc:
            log.warning("⚠ Não foi possível alcançar ERSUS360: %s", exc)
    else:
        log.warning("⚠ ERSUS_SYNC_KEY não definida — dados não serão enviados ao ERSUS360")

    log.info("")
    log.info("Teste concluído. Para sincronizar: python pec_sync.py --once")


def main():
    args = sys.argv[1:]

    log.info("═" * 60)
    log.info("ERSUS360 Sync Agent v1.2.0")
    log.info("PEC: %s:%d/%s", PEC_DB_HOST, PEC_DB_PORT, PEC_DB_NAME)
    log.info("ERSUS360: %s", ERSUS_URL)
    log.info("═" * 60)

    if "--test" in args:
        modo_teste()
        return

    # Exploração de schema na primeira execução
    try:
        conn = conectar_pec()
        explorar_schema(conn)
        conn.close()
    except Exception as exc:
        log.error("Não foi possível explorar schema: %s", exc)

    if "--once" in args:
        log.info("Modo --once: sincronizando uma vez e saindo...")
        sincronizar()
        log.info("Concluído.")
        return

    # Modo contínuo: executa imediatamente e depois a cada N horas
    sincronizar()
    schedule.every(SYNC_INTERVAL_HOURS).hours.do(sincronizar)

    log.info("Agendado: sincronizar a cada %dh. Pressione Ctrl+C para parar.", SYNC_INTERVAL_HOURS)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
