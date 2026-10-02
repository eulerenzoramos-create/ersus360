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
from datetime import datetime, date, timedelta, timezone
from pathlib import Path

# Pasta do agente: log, schema e backups ficam aqui, nunca no diretorio atual
# (a tarefa agendada roda como SYSTEM com cwd = C:\Windows\System32).
AQUI = Path(__file__).resolve().parent

# Carrega .env se existir (sem depender de python-dotenv)
_env_file = AQUI / ".env"
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
        logging.FileHandler(AQUI / "pec_sync.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("pec_sync")


def conectar_pec():
    """Abre conexão SOMENTE LEITURA com o PostgreSQL local do PEC."""
    conn = psycopg2.connect(
        host=PEC_DB_HOST,
        port=PEC_DB_PORT,
        dbname=PEC_DB_NAME,
        user=PEC_DB_USER,
        password=PEC_DB_PASS,
        connect_timeout=10,
        options="-c client_encoding=UTF8",
    )
    # Defesa em profundidade: mesmo que o usuario do banco tenha permissao de
    # escrita, esta sessao nao consegue alterar nada no PEC.
    conn.set_session(readonly=True)
    return conn


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


def _cte_pacientes_condicao(ciaps: tuple[str, ...]) -> str:
    """
    CTE com os cidadaos da equipe que tem problema ATIVO com algum dos CIAP
    informados (identificados por nu_cns). Parametros (nesta ordem):
    padrao de situacao ('%ativo%'), co_dim_equipe, co_dim_equipe.
    """
    lista = ", ".join(f"'{c}'" for c in ciaps)
    return f"""
        SELECT DISTINCT p.nu_cns::text AS nu_cns
        FROM tb_fat_atd_ind_problemas p
        JOIN tb_dim_ciap c ON c.co_seq_dim_ciap = p.co_dim_ciap
        LEFT JOIN tb_dim_situacao_problema sp
               ON sp.co_seq_dim_situacao = p.co_dim_situacao_problema
        WHERE c.nu_ciap IN ({lista})
          AND (sp.ds_situacao_problema ILIKE %s OR p.co_dim_situacao_problema IS NULL)
          AND (p.co_dim_equipe_1 = %s OR p.co_dim_equipe_2 = %s)
          AND p.nu_cns IS NOT NULL
    """


def _cte_cidadaos_equipe() -> str:
    """CTE base: cidadaos vivos vinculados a equipe (1 parametro: co_dim_equipe)."""
    return """
        SELECT fc.co_cidadao, fc.nu_cns::text AS nu_cns,
               t.dt_registro AS dt_nasc, sx.ds_sexo
        FROM tb_fat_cidadao_pec fc
        LEFT JOIN tb_dim_tempo t ON t.co_seq_dim_tempo = fc.co_dim_tempo_nascimento
        LEFT JOIN tb_dim_sexo sx ON sx.co_seq_dim_sexo = fc.co_dim_sexo
        WHERE fc.co_dim_equipe_vinc = %s
          AND fc.nu_cns IS NOT NULL
          AND COALESCE(fc.st_faleceu, 0) = 0
          AND COALESCE(fc.st_deletar, 0) = 0
    """


def _pct(cur, sql: str, params: tuple, chave: str, result: dict) -> None:
    """
    Executa uma consulta den/num e grava o percentual so se den > 0.
    Uma falha isola apenas este indicador (rollback + aviso), sem perder os demais.
    """
    try:
        cur.execute(sql, params)
        row = cur.fetchone()
        if row and row["den"]:
            result[chave] = round(row["num"] / row["den"] * 100, 1)
    except Exception as exc:
        cur.connection.rollback()
        log.warning("Indicador %s nao calculado: %s", chave, exc)


# Codigos de procedimento (tb_dim_procedimento.co_proced) confirmados no schema real.
PROCED_HBA1C = ("ABEX008", "0202010503")
PROCED_CITOPATOLOGICO = ("ABEX001", "0203010019", "ABPG010", "0201020033")

# Vacinas da boa pratica E do C2 (co_imunobiologico = codigos do guia oficial).
# Combinadas contam em cada componente (ex.: Hexa acelular = Penta + Polio).
VAC_PENTA  = ("29", "39", "42", "43", "46", "47", "58")
VAC_POLIO  = ("22", "29", "43", "58")
VAC_SCR    = ("24", "56", "73")
VAC_PNEUMO = ("26", "59", "106", "107")
# Esquema MINIMO adotado na previa (doses distintas ate 2 anos). Premissa a conferir no piloto.
MIN_DOSES = {"penta": 3, "polio": 3, "scr": 2, "pneumo": 2}


def _lista_sql(codigos) -> str:
    return ", ".join(f"'{c}'" for c in codigos)


def calcular_indicadores(conn, competencia: str, ine: str) -> dict:
    """
    Calcula indicadores por equipe numa competencia e devolve so o que foi
    possivel calcular com confianca no schema real do e-SUS PEC 5.x
    (esquema de fatos/dimensoes tb_fat_*/tb_dim_*, confirmado em 18/09 e
    02/10/2026 por introspeccao somente-leitura).

    TODOS os valores sao PREVIAS LOCAIS do e-SUS PEC, nao a pontuacao
    oficial do Ministerio (que vem do SIAPS). Calculados: C2 (previa A-E), C3 (pre-natal), C4 (diabetes/HbA1c), C5 (hipertensao)
    e C7 (citopatologico).
    NAO calculados, de proposito: C1 (Mais Acesso, razao oficial ponderada)
    e C6 (avaliacao multidimensional do idoso) — sem equivalente neste PEC;
    nada e estimado.

    Premissas a conferir na rodada piloto contra os relatorios oficiais:
      - vinculo do cidadao a equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc;
      - cidadao identificado por CNS (necessario para juntar as tabelas fato);
      - "consulta" = tipo de atendimento 1 ou 2 (consulta agendada);
      - exame realizado = dt_realizacao, senao dt_resultado, senao dt_solicitacao.
    """
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    ano, mes = int(competencia[:4]), int(competencia[5:])
    fim   = date(ano, mes, 28)
    ini6  = fim - timedelta(days=182)
    ini12 = fim - timedelta(days=365)
    ini36 = fim - timedelta(days=1095)

    result: dict = {}
    ATIVO = "%ativo%"

    try:
        cur.execute("""
            SELECT co_seq_dim_equipe FROM tb_dim_equipe
            WHERE nu_ine = %s AND st_registro_valido = 1
        """, (ine,))
        row = cur.fetchone()
        if not row:
            log.warning("INE %s nao encontrado em tb_dim_equipe", ine)
            return {}
        eq = row["co_seq_dim_equipe"]

        has = _cte_pacientes_condicao(("K86", "K87", "K85"))
        dm  = _cte_pacientes_condicao(("T89", "T90"))

        # C1 (Mais Acesso) nao e calculado: o C1 oficial e uma razao de acesso
        # ponderada pelo Ministerio, sem equivalente simples no PEC.

        # C2 (previa A-E, max. 100 pts): criancas < 2 anos da equipe.
        #   A: consulta de medico/enfermeiro ate o 30o dia de vida        (20)
        #   B: >= 9 consultas de medico/enfermeiro ate 2 anos             (20)
        #   C: >= 9 dias com peso e altura registrados ate 2 anos         (20)
        #   D: >= 2 visitas de ACS/TACS (1a ate 30 dias, 2a ate 6 meses)  (20)
        #   E: vacinas Penta/Polio/SCR/Pneumo com o esquema minimo (MIN_DOSES)   (20)
        _pct(cur, f"""
            WITH criancas AS (
                SELECT nu_cns, dt_nasc FROM ({_cte_cidadaos_equipe()}) b
                WHERE b.dt_nasc IS NOT NULL
                  AND b.dt_nasc <= %s::date
                  AND b.dt_nasc > (%s::date - INTERVAL '2 years')::date
            ),
            cons AS (
                SELECT c.nu_cns, c.dt_nasc, a.dt_inicial_atendimento::date AS dt
                FROM criancas c
                JOIN tb_fat_atendimento_individual a ON a.nu_cns::text = c.nu_cns
                JOIN tb_dim_cbo cb ON cb.co_seq_dim_cbo IN (a.co_dim_cbo_1, a.co_dim_cbo_2)
                WHERE cb.nu_cbo ~ '^(2235|2251|2252)'
                  AND a.dt_inicial_atendimento::date BETWEEN c.dt_nasc
                      AND LEAST((c.dt_nasc + INTERVAL '2 years')::date, %s::date)
            ),
            ok_a AS (SELECT DISTINCT nu_cns FROM cons WHERE dt <= dt_nasc + 30),
            ok_b AS (SELECT nu_cns FROM cons GROUP BY nu_cns HAVING COUNT(DISTINCT dt) >= 9),
            ok_c AS (
                SELECT c.nu_cns
                FROM criancas c
                JOIN tb_fat_atendimento_individual a ON a.nu_cns::text = c.nu_cns
                WHERE a.nu_peso IS NOT NULL AND a.nu_altura IS NOT NULL
                  AND a.dt_inicial_atendimento::date BETWEEN c.dt_nasc
                      AND LEAST((c.dt_nasc + INTERVAL '2 years')::date, %s::date)
                GROUP BY c.nu_cns
                HAVING COUNT(DISTINCT a.dt_inicial_atendimento::date) >= 9
            ),
            vis AS (
                SELECT c.nu_cns, c.dt_nasc, t.dt_registro AS dt
                FROM criancas c
                JOIN tb_fat_visita_domiciliar v ON v.nu_cns::text = c.nu_cns
                JOIN tb_dim_cbo cb ON cb.co_seq_dim_cbo = v.co_dim_cbo
                JOIN tb_dim_tempo t ON t.co_seq_dim_tempo = v.co_dim_tempo
                WHERE cb.nu_cbo IN ('515105', '322255')
                  AND t.dt_registro BETWEEN c.dt_nasc
                      AND LEAST((c.dt_nasc + INTERVAL '6 months')::date, %s::date)
            ),
            ok_d AS (
                SELECT nu_cns FROM vis GROUP BY nu_cns
                HAVING COUNT(DISTINCT dt) >= 2 AND MIN(dt) <= MIN(dt_nasc) + 30
            ),
            vac AS (
                SELECT c.nu_cns, im.nu_identificador AS imu, vv.co_dim_dose_imunobiologico AS dose
                FROM criancas c
                JOIN tb_fat_vacinacao fv ON fv.nu_cns::text = c.nu_cns
                JOIN tb_fat_vacinacao_vacina vv ON vv.co_fat_vacinacao = fv.co_seq_fat_vacinacao
                JOIN tb_dim_imunobiologico im ON im.co_seq_dim_imunobiologico = vv.co_dim_imunobiologico
                WHERE fv.dt_inicial_atendimento::date BETWEEN c.dt_nasc
                      AND LEAST((c.dt_nasc + INTERVAL '2 years')::date, %s::date)
            ),
            grp AS (
                SELECT nu_cns,
                  COUNT(DISTINCT dose) FILTER (WHERE imu IN ({_lista_sql(VAC_PENTA)}))  AS penta,
                  COUNT(DISTINCT dose) FILTER (WHERE imu IN ({_lista_sql(VAC_POLIO)}))  AS polio,
                  COUNT(DISTINCT dose) FILTER (WHERE imu IN ({_lista_sql(VAC_SCR)}))    AS scr,
                  COUNT(DISTINCT dose) FILTER (WHERE imu IN ({_lista_sql(VAC_PNEUMO)})) AS pneumo
                FROM vac GROUP BY nu_cns
            ),
            ok_e AS (
                SELECT nu_cns FROM grp
                WHERE penta >= {MIN_DOSES['penta']} AND polio >= {MIN_DOSES['polio']}
                  AND scr >= {MIN_DOSES['scr']} AND pneumo >= {MIN_DOSES['pneumo']}
            ),
            pontos AS (
                SELECT 20 * ( (c.nu_cns IN (SELECT nu_cns FROM ok_a))::int
                            + (c.nu_cns IN (SELECT nu_cns FROM ok_b))::int
                            + (c.nu_cns IN (SELECT nu_cns FROM ok_c))::int
                            + (c.nu_cns IN (SELECT nu_cns FROM ok_d))::int
                            + (c.nu_cns IN (SELECT nu_cns FROM ok_e))::int ) AS pts
                FROM criancas c
            )
            SELECT (SELECT COUNT(*) FROM pontos) * 100 AS den,
                   (SELECT COALESCE(SUM(pts), 0) FROM pontos) AS num
        """, (eq, fim, fim, fim, fim, fim, fim), "C2", result)

        # C5: HAS com PA aferida nos ultimos 6 meses
        _pct(cur, f"""
            WITH base AS ({has}),
            com AS (
                SELECT DISTINCT a.nu_cns::text AS nu_cns
                FROM tb_fat_atendimento_individual a
                WHERE a.dt_inicial_atendimento BETWEEN %s AND %s
                  AND a.nu_pressao_sistolica IS NOT NULL
            )
            SELECT (SELECT COUNT(*) FROM base) AS den,
                   (SELECT COUNT(*) FROM base WHERE nu_cns IN (SELECT nu_cns FROM com)) AS num
        """, (ATIVO, eq, eq, ini6, fim), "C5", result)

        # C4: DM com HbA1c solicitada/realizada nos ultimos 12 meses
        _pct(cur, f"""
            WITH base AS ({dm}),
            por_proced AS (
                SELECT DISTINCT pr.nu_cns::text AS nu_cns
                FROM tb_fat_atd_ind_procedimentos pr
                JOIN tb_dim_procedimento dp
                  ON dp.co_seq_dim_procedimento IN
                     (pr.co_dim_procedimento_solicitado, pr.co_dim_procedimento_avaliado)
                WHERE dp.co_proced = ANY(%s)
                  AND pr.dt_inicial_atendimento BETWEEN %s AND %s
            ),
            por_exame AS (
                SELECT DISTINCT fc.nu_cns::text AS nu_cns
                FROM tb_exame_hemoglobina_glicada hg
                JOIN tb_exame_requisitado er ON er.co_seq_exame_requisitado = hg.co_exame_requisitado
                JOIN tb_prontuario pt ON pt.co_seq_prontuario = er.co_prontuario
                JOIN tb_fat_cidadao_pec fc ON fc.co_cidadao = pt.co_cidadao
                WHERE COALESCE(er.dt_realizacao, er.dt_resultado, er.dt_solicitacao)
                      BETWEEN %s AND %s
            ),
            com AS (SELECT nu_cns FROM por_proced UNION SELECT nu_cns FROM por_exame)
            SELECT (SELECT COUNT(*) FROM base) AS den,
                   (SELECT COUNT(*) FROM base WHERE nu_cns IN (SELECT nu_cns FROM com)) AS num
        """, (ATIVO, eq, eq, list(PROCED_HBA1C), ini12, fim, ini12, fim), "C4", result)

        # C3: gestantes (DUM nos ultimos 12 meses) com >= 6 consultas desde a DUM
        _pct(cur, """
            WITH gest AS (
                SELECT fc.nu_cns::text AS nu_cns,
                       MAX(pn.dt_ultima_menstruacao)::date AS dum
                FROM tb_pre_natal pn
                JOIN tb_prontuario pt ON pt.co_seq_prontuario = pn.co_prontuario
                JOIN tb_fat_cidadao_pec fc ON fc.co_cidadao = pt.co_cidadao
                WHERE fc.co_dim_equipe_vinc = %s
                  AND fc.nu_cns IS NOT NULL
                  AND COALESCE(fc.st_faleceu, 0) = 0
                  AND COALESCE(fc.st_deletar, 0) = 0
                  AND pn.dt_ultima_menstruacao BETWEEN %s AND %s
                GROUP BY fc.nu_cns
            ),
            com6 AS (
                SELECT g.nu_cns
                FROM gest g
                JOIN tb_fat_atendimento_individual a ON a.nu_cns::text = g.nu_cns
                JOIN tb_dim_tipo_atendimento ta
                  ON ta.co_seq_dim_tipo_atendimento = a.co_dim_tipo_atendimento
                WHERE ta.nu_identificador IN ('1', '2')
                  AND a.dt_inicial_atendimento >= g.dum
                  AND a.dt_inicial_atendimento < %s::date + 1
                GROUP BY g.nu_cns
                HAVING COUNT(*) >= 6
            )
            SELECT (SELECT COUNT(*) FROM gest) AS den,
                   (SELECT COUNT(*) FROM com6) AS num
        """, (eq, ini12, fim, fim), "C3", result)

        # C7: mulheres 25-64 anos com citopatologico nos ultimos 3 anos
        _pct(cur, f"""
            WITH mulheres AS (
                SELECT DISTINCT nu_cns FROM ({_cte_cidadaos_equipe()}) b
                WHERE b.ds_sexo ILIKE %s
                  AND DATE_PART('year', AGE(%s::date, b.dt_nasc)) BETWEEN 25 AND 64
            ),
            por_proced AS (
                SELECT DISTINCT pr.nu_cns::text AS nu_cns
                FROM tb_fat_atd_ind_procedimentos pr
                JOIN tb_dim_procedimento dp
                  ON dp.co_seq_dim_procedimento IN
                     (pr.co_dim_procedimento_solicitado, pr.co_dim_procedimento_avaliado)
                WHERE dp.co_proced = ANY(%s)
                  AND pr.dt_inicial_atendimento BETWEEN %s AND %s
            ),
            por_exame AS (
                SELECT DISTINCT fc.nu_cns::text AS nu_cns
                FROM tb_sol_exame_citopatologico s
                JOIN tb_exame_requisitado er ON er.co_requisicao_exame = s.co_requisicao_exame
                JOIN tb_prontuario pt ON pt.co_seq_prontuario = er.co_prontuario
                JOIN tb_fat_cidadao_pec fc ON fc.co_cidadao = pt.co_cidadao
                WHERE COALESCE(er.dt_realizacao, er.dt_resultado, er.dt_solicitacao)
                      BETWEEN %s AND %s
            ),
            com AS (SELECT nu_cns FROM por_proced UNION SELECT nu_cns FROM por_exame)
            SELECT (SELECT COUNT(*) FROM mulheres) AS den,
                   (SELECT COUNT(*) FROM mulheres WHERE nu_cns IN (SELECT nu_cns FROM com)) AS num
        """, (eq, "fem%", fim, list(PROCED_CITOPATOLOGICO), ini36, fim, ini36, fim), "C7", result)

        # C2 e C6: sem mapeamento neste PEC (ver docstring) — nao calculados.

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
    with open(AQUI / "schema_pec.txt", "w", encoding="utf-8") as f:
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
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "equipes": {},       # { nome: { C1: pct, ... } }
        "tipos_equipe": {},  # { nome: "eSF" | "eSFR" | "eSB" | ... }
        "origem": "previa_pec",  # nunca e o resultado oficial do SIAPS
        "observacoes": {
            "C2": "Prévia: boas práticas A–E (máx. 100 pts); vacinas pelo esquema mínimo adotado (3 Penta, 3 Polio, 2 SCR, 2 Pneumo), a conferir no piloto",
            "C3": "Prévia: gestantes com ≥6 consultas desde a DUM",
            "C4": "Prévia: diabéticos com HbA1c solicitada/realizada em 12 meses",
            "C5": "Prévia: hipertensos com PA aferida em 6 meses",
            "C7": "Prévia: mulheres 25–64 anos com citopatológico em 3 anos",
        },
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
    with open(AQUI / f"sync_backup_{comp.replace('-','')}.json", "w", encoding="utf-8") as f:
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
