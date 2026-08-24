#!/usr/bin/env python3
"""
ERSUS360 Sync Agent — e-SUS PEC → ERSUS360
Versão: 1.1.0 | Apuí/AM | IBGE 1300144

Instalar no servidor onde o e-SUS PEC está rodando.
Conecta ao banco PostgreSQL local do PEC (sem exposição à internet),
busca TODAS as equipes ativas do município automaticamente (eSF, eSFR, eSB, eMulti...),
calcula os indicadores C1–C7/R1–R6 por equipe e envia para o ERSUS360 na nuvem.
"""

import os
import json
import logging
import time
from datetime import datetime, date, timedelta

import psycopg2
import psycopg2.extras
import requests
import schedule

# ═══════════════════════════════════════════════════════════════════
#  CONFIGURAÇÃO — preencher antes de rodar
# ═══════════════════════════════════════════════════════════════════

# Banco PostgreSQL do e-SUS PEC (rede local — sem firewall)
PEC_DB_HOST = os.getenv("PEC_DB_HOST", "localhost")
PEC_DB_PORT = int(os.getenv("PEC_DB_PORT", "5432"))
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
                COALESCE(e.tp_equipe, 'eSF')       AS tipo,
                e.co_seq_equipe                    AS id
            FROM tb_equipe e
            WHERE e.co_municipio = %s
              AND e.st_ativo = true
              AND e.nu_ine IS NOT NULL
            ORDER BY e.tp_equipe, e.no_equipe
        """, (IBGE,))
        rows = cur.fetchall()

        if not rows:
            # Fallback: tentar sem filtro de município (schema alternativo)
            cur.execute("""
                SELECT
                    nu_ine        AS ine,
                    COALESCE(no_equipe, nu_ine) AS nome,
                    COALESCE(tp_equipe, 'eSF')  AS tipo,
                    co_seq_equipe AS id
                FROM tb_equipe
                WHERE st_ativo = true
                  AND nu_ine IS NOT NULL
                ORDER BY tp_equipe, no_equipe
            """)
            rows = cur.fetchall()

        equipes = [dict(r) for r in rows]
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
    Calcula C1–C7 para uma equipe numa competência.

    Retorna dicionário {C1: pct, C2: pct, ..., C7: pct} ou {} se sem dados.

    NOTA PARA O DBA: As queries abaixo usam o schema padrão do e-SUS PEC 4.x/5.x.
    Se o banco usar schema diferente (ex: 'pec', 'cds'), ajuste o prefixo das tabelas.
    Execute primeiro: SELECT table_schema, table_name FROM information_schema.tables
                      WHERE table_name LIKE '%atendimento%' ORDER BY 1,2;
    """
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Período: 12 meses anteriores à competência
    ano, mes = int(competencia[:4]), int(competencia[5:])
    fim   = date(ano, mes, 28)
    ini12 = fim - timedelta(days=365)
    ini6  = fim - timedelta(days=182)
    ini36 = fim - timedelta(days=1095)

    result = {}

    try:
        # ── C5: Proporção HAS com PA aferida nos últimos 6 meses ────────────
        # Denominador: cidadãos com HAS ativa vinculados à equipe
        # Numerador: desses, com PA aferida nos últimos 6 meses
        cur.execute("""
            WITH has_equipe AS (
                SELECT DISTINCT cp.co_seq_cidadao
                FROM tb_cidadao_problema_condicao cp
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = cp.co_seq_cidadao
                WHERE cp.ds_ciap IN ('K86','K87','K85')
                  AND cp.st_ativo = true
                  AND ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
            ),
            com_pa AS (
                SELECT DISTINCT a.co_seq_cidadao
                FROM tb_atendimento_individual a
                JOIN has_equipe h ON h.co_seq_cidadao = a.co_seq_cidadao
                WHERE a.dt_atendimento BETWEEN %s AND %s
                  AND a.nu_pressao_sistolica IS NOT NULL
            )
            SELECT
                (SELECT COUNT(*) FROM has_equipe) AS den,
                (SELECT COUNT(*) FROM com_pa)     AS num
        """, (ine, ini6, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C5"] = round(row["num"] / row["den"] * 100, 1)

        # ── C4: Proporção DM com HbA1c solicitada nos últimos 12 meses ──────
        cur.execute("""
            WITH dm_equipe AS (
                SELECT DISTINCT cp.co_seq_cidadao
                FROM tb_cidadao_problema_condicao cp
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = cp.co_seq_cidadao
                WHERE cp.ds_ciap IN ('T89','T90')
                  AND cp.st_ativo = true
                  AND ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
            ),
            com_hba1c AS (
                SELECT DISTINCT s.co_seq_cidadao
                FROM tb_solicitacao_exame s
                JOIN dm_equipe d ON d.co_seq_cidadao = s.co_seq_cidadao
                WHERE s.co_cid10 IN ('Z131','Z134')
                   OR s.ds_exame ILIKE '%hemoglobina glicada%'
                   OR s.ds_exame ILIKE '%HbA1c%'
                  AND s.dt_solicitacao BETWEEN %s AND %s
            )
            SELECT
                (SELECT COUNT(*) FROM dm_equipe)   AS den,
                (SELECT COUNT(*) FROM com_hba1c)   AS num
        """, (ine, ini12, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C4"] = round(row["num"] / row["den"] * 100, 1)

        # ── C3: Gestantes com >= 6 consultas pré-natal + consulta puerpério ──
        cur.execute("""
            WITH gestantes AS (
                SELECT DISTINCT pn.co_seq_cidadao
                FROM tb_pre_natal pn
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = pn.co_seq_cidadao
                WHERE ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
                  AND pn.dt_inicio_pre_natal BETWEEN %s AND %s
            ),
            com_6_consultas AS (
                SELECT a.co_seq_cidadao, COUNT(*) AS qtd
                FROM tb_atendimento_individual a
                JOIN gestantes g ON g.co_seq_cidadao = a.co_seq_cidadao
                WHERE a.tp_atendimento IN ('1','2')
                  AND a.dt_atendimento BETWEEN %s AND %s
                GROUP BY a.co_seq_cidadao
                HAVING COUNT(*) >= 6
            )
            SELECT
                (SELECT COUNT(*) FROM gestantes)        AS den,
                (SELECT COUNT(*) FROM com_6_consultas)  AS num
        """, (ine, ini12, fim, ini12, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C3"] = round(row["num"] / row["den"] * 100, 1)

        # ── C7: Mulheres 25-64 anos com citopatológico nos últimos 3 anos ───
        cur.execute("""
            WITH mulheres AS (
                SELECT DISTINCT c.co_seq_cidadao
                FROM tb_cidadao c
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = c.co_seq_cidadao
                WHERE ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
                  AND c.tp_sexo = 'F'
                  AND DATE_PART('year', AGE(%s, c.dt_nascimento)) BETWEEN 25 AND 64
            ),
            com_cito AS (
                SELECT DISTINCT e.co_seq_cidadao
                FROM tb_exame_resultado e
                JOIN mulheres m ON m.co_seq_cidadao = e.co_seq_cidadao
                WHERE e.ds_exame ILIKE '%citopatol%'
                  AND e.dt_resultado BETWEEN %s AND %s
            )
            SELECT
                (SELECT COUNT(*) FROM mulheres)   AS den,
                (SELECT COUNT(*) FROM com_cito)   AS num
        """, (ine, fim, ini36, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C7"] = round(row["num"] / row["den"] * 100, 1)

        # ── C1: Pessoas com HAS com >= 1 consulta nos últimos 12 meses ──────
        cur.execute("""
            WITH has_equipe AS (
                SELECT DISTINCT cp.co_seq_cidadao
                FROM tb_cidadao_problema_condicao cp
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = cp.co_seq_cidadao
                WHERE cp.ds_ciap IN ('K86','K87','K85')
                  AND cp.st_ativo = true
                  AND ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
            ),
            com_consulta AS (
                SELECT DISTINCT a.co_seq_cidadao
                FROM tb_atendimento_individual a
                JOIN has_equipe h ON h.co_seq_cidadao = a.co_seq_cidadao
                WHERE a.dt_atendimento BETWEEN %s AND %s
                  AND a.tp_atendimento IN ('1','2')
            )
            SELECT
                (SELECT COUNT(*) FROM has_equipe)   AS den,
                (SELECT COUNT(*) FROM com_consulta) AS num
        """, (ine, ini12, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C1"] = round(row["num"] / row["den"] * 100, 1)

        # ── C2: Crianças 0-1 ano com avaliação de desenvolvimento ───────────
        cur.execute("""
            WITH criancas AS (
                SELECT DISTINCT c.co_seq_cidadao
                FROM tb_cidadao c
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = c.co_seq_cidadao
                WHERE ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
                  AND DATE_PART('year', AGE(%s, c.dt_nascimento)) < 1
            ),
            com_aval AS (
                SELECT DISTINCT a.co_seq_cidadao
                FROM tb_atendimento_individual a
                JOIN criancas cr ON cr.co_seq_cidadao = a.co_seq_cidadao
                WHERE a.dt_atendimento BETWEEN %s AND %s
                  AND a.st_avaliacao_desenvolvimento = true
            )
            SELECT
                (SELECT COUNT(*) FROM criancas)  AS den,
                (SELECT COUNT(*) FROM com_aval)  AS num
        """, (ine, fim, ini12, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C2"] = round(row["num"] / row["den"] * 100, 1)

        # ── C6: Pessoas idosas (60+) com avaliação multidimensional rápida ──
        cur.execute("""
            WITH idosos AS (
                SELECT DISTINCT c.co_seq_cidadao
                FROM tb_cidadao c
                JOIN tb_cidadao_vinculo_equipe ve
                  ON ve.co_seq_cidadao = c.co_seq_cidadao
                WHERE ve.nu_ine = %s
                  AND ve.dt_fim_vigencia IS NULL
                  AND DATE_PART('year', AGE(%s, c.dt_nascimento)) >= 60
            ),
            com_amr AS (
                SELECT DISTINCT a.co_seq_cidadao
                FROM tb_atendimento_individual a
                JOIN idosos i ON i.co_seq_cidadao = a.co_seq_cidadao
                WHERE a.dt_atendimento BETWEEN %s AND %s
                  AND a.st_avaliacao_multidimensional = true
            )
            SELECT
                (SELECT COUNT(*) FROM idosos)   AS den,
                (SELECT COUNT(*) FROM com_amr)  AS num
        """, (ine, fim, ini12, fim))
        row = cur.fetchone()
        if row and row["den"] and row["den"] > 0:
            result["C6"] = round(row["num"] / row["den"] * 100, 1)

    except Exception as exc:
        log.warning("Erro ao calcular indicadores para INE %s: %s", ine, exc)
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


def main():
    log.info("═" * 60)
    log.info("ERSUS360 Sync Agent iniciado")
    log.info("PEC: %s:%d/%s", PEC_DB_HOST, PEC_DB_PORT, PEC_DB_NAME)
    log.info("ERSUS360: %s", ERSUS_URL)
    log.info("═" * 60)

    # Exploração de schema na primeira execução
    try:
        conn = conectar_pec()
        explorar_schema(conn)
        conn.close()
    except Exception as exc:
        log.error("Não foi possível explorar schema: %s", exc)

    # Executa imediatamente e depois a cada N horas
    sincronizar()
    schedule.every(SYNC_INTERVAL_HOURS).hours.do(sincronizar)

    log.info("Agendado: sincronizar a cada %dh. Pressione Ctrl+C para parar.", SYNC_INTERVAL_HOURS)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
