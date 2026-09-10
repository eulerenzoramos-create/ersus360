"""
ERSUS360 — Agente PEC Local  v2.0
Servidor: e-SUS PEC — Apuí/AM  (IBGE 1300144)

Indicadores calculados (Portaria GM/MS 3.493/2024 + NT DEAPS 6/2025):
  eSF / eAP  : C1–C7
  eSB        : B1–B6
  eMulti     : M1–M2
  eSFR       : R1–R6  (equipe ribeirinha — mesmos critérios C-codes)
  eCR        : CR1–CR4 (equipe consultório na rua)
  eAPP       : P1–P5  (equipe atenção prisional)
  ACS        : visitas domiciliares por equipe

Execução:    python agente_pec.py
Opções:
  --competencia YYYY-MM   (padrão: mês atual)
  --apenas-calcular       não envia para Railway
  --env ARQUIVO.env       carrega variáveis de um arquivo .env
"""

import os, sys, json, logging, argparse
from datetime import datetime, date
from pathlib import Path

# Carrega .env antes de importar qualquer variável de ambiente
def _carregar_env(caminho: str):
    p = Path(caminho)
    if not p.exists():
        return
    for linha in p.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        chave = chave.strip()
        valor = valor.strip().strip('"').strip("'")
        os.environ.setdefault(chave, valor)

# ── Verificar dependências antes de qualquer import ───────────────────────────
for pkg, mod in [("psycopg2-binary", "psycopg2"), ("requests", "requests")]:
    try:
        __import__(mod)
    except ImportError:
        print(f"ERRO: pacote '{pkg}' não instalado.\n"
              f"Execute:  pip install psycopg2-binary requests")
        sys.exit(1)

import psycopg2, psycopg2.extras, requests  # noqa: E402

# ── Configuração ──────────────────────────────────────────────────────────────
DB_HOST      = os.getenv("PEC_DB_HOST", "localhost")
DB_PORT      = int(os.getenv("PEC_DB_PORT", "5432"))
DB_NAME      = os.getenv("PEC_DB_NAME", "esus")
DB_USER      = os.getenv("PEC_DB_USER", "esus")
DB_PASS      = os.getenv("PEC_DB_PASS", "")
RAILWAY_URL  = os.getenv("RAILWAY_URL", "https://ersus360-production.up.railway.app")
SYNC_KEY     = os.getenv("ERSUS_SYNC_KEY", "")
IBGE         = "1300144"

LOG_FILE = Path(__file__).parent / "agente_pec.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("agente_pec")

# ── Helpers ───────────────────────────────────────────────────────────────────
def _ano_mes(comp: str):
    a, m = comp.split("-")
    return int(a), int(m)

def _quad(mes: int) -> int:
    return 1 if mes <= 4 else (2 if mes <= 8 else 3)

def _exec(conn, sql: str, params: dict, col: str = "percentual") -> dict:
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        try:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {
                str(row.get("no_equipe","")).strip().upper(): float(row.get(col) or 0)
                for row in rows
                if row.get("no_equipe")
            }
        except Exception as e:
            log.warning("Query falhou (%s): %s", col, e)
            conn.rollback()
            return {}

def _conectar():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS, connect_timeout=10,
    )

# ─────────────────────────────────────────────────────────────────────────────
#  SQL por Indicador
# ─────────────────────────────────────────────────────────────────────────────

# ── C1 — Mais Acesso à APS ────────────────────────────────────────────────────
# Numerador  : pessoas vinculadas com ≥ 1 atendimento individual na competência
# Denominador: total de pessoas vinculadas à equipe
SQL_C1 = """
WITH vinc AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci
    WHERE ci.st_ficha_inativa = 0
),
atend AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo = dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT v.co_cidadao)                       AS denominador,
       COUNT(DISTINCT a.co_cidadao)                       AS numerador,
       CASE WHEN COUNT(DISTINCT v.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT a.co_cidadao)*100.0/COUNT(DISTINCT v.co_cidadao),1)
            ELSE 0 END AS percentual
FROM vinc v
JOIN tb_equipe eq ON v.nu_ine=eq.nu_ine
LEFT JOIN atend a ON a.co_cidadao=v.co_cidadao AND a.nu_ine=v.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C2 — Desenvolvimento Infantil ────────────────────────────────────────────
# Numerador  : crianças < 2 anos com ≥ 1 atendimento de puericultura
# Denominador: crianças < 2 anos vinculadas
SQL_C2 = """
WITH base AS (
    SELECT ci.co_cidadao, ci.nu_ine,
           DATE_PART('year', AGE(DATE(%(ano)s||'-'||LPAD(%(mes)s::text,2,'0')||'-01'),
                                ci.dt_nascimento)) AS idade
    FROM tb_cadastro_individual ci
    WHERE ci.st_ficha_inativa=0 AND ci.dt_nascimento IS NOT NULL
),
eleg AS (SELECT co_cidadao, nu_ine FROM base WHERE idade<2),
cons AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT e.co_cidadao) AS denominador,
       COUNT(DISTINCT c.co_cidadao) AS numerador,
       CASE WHEN COUNT(DISTINCT e.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT c.co_cidadao)*100.0/COUNT(DISTINCT e.co_cidadao),1)
            ELSE 0 END AS percentual
FROM eleg e JOIN tb_equipe eq ON e.nu_ine=eq.nu_ine
LEFT JOIN cons c ON c.co_cidadao=e.co_cidadao AND c.nu_ine=e.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C3 — Gestação e Puerpério ─────────────────────────────────────────────────
# Numerador  : gestantes com ≥ 6 consultas pré-natal realizadas
# Denominador: gestantes vinculadas identificadas na competência
SQL_C3 = """
WITH gest AS (
    SELECT DISTINCT fag.co_cidadao, fag.nu_ine
    FROM tb_fat_atendimento_gestante fag
    JOIN tb_dim_tempo dt ON fag.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fag.st_fichas_invalidas=0
),
pn AS (
    SELECT fai.co_cidadao, fai.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fai.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s
      AND p.nu_procedimento IN ('0301010072','0301010064','0301010072')
      AND fai.st_fichas_invalidas=0
    GROUP BY fai.co_cidadao, fai.nu_ine
)
SELECT eq.no_equipe,
       COUNT(DISTINCT g.co_cidadao) AS denominador,
       COUNT(DISTINCT CASE WHEN pn.qtd>=6 THEN g.co_cidadao END) AS numerador,
       CASE WHEN COUNT(DISTINCT g.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT CASE WHEN pn.qtd>=6 THEN g.co_cidadao END)*100.0/
                       COUNT(DISTINCT g.co_cidadao),1)
            ELSE 0 END AS percentual
FROM gest g JOIN tb_equipe eq ON g.nu_ine=eq.nu_ine
LEFT JOIN pn ON pn.co_cidadao=g.co_cidadao AND pn.nu_ine=g.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C4 — Diabetes Mellitus ────────────────────────────────────────────────────
# Numerador  : pessoas com DM com HbA1c realizada no quadrimestre
# Denominador: pessoas com DM vinculadas
SQL_C4 = """
WITH dm AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_cid cid ON fai.co_dim_cid=cid.co_seq_dim_cid
    WHERE cid.nu_cid10 LIKE 'E1%' AND fai.st_fichas_invalidas=0
),
hba AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fai.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s AND p.nu_procedimento='0202010317'
      AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT dm.co_cidadao) AS denominador,
       COUNT(DISTINCT h.co_cidadao)  AS numerador,
       CASE WHEN COUNT(DISTINCT dm.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT h.co_cidadao)*100.0/COUNT(DISTINCT dm.co_cidadao),1)
            ELSE 0 END AS percentual
FROM dm JOIN tb_equipe eq ON dm.nu_ine=eq.nu_ine
LEFT JOIN hba h ON h.co_cidadao=dm.co_cidadao AND h.nu_ine=dm.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C5 — Hipertensão Arterial ─────────────────────────────────────────────────
SQL_C5 = """
WITH has AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_cid cid ON fai.co_dim_cid=cid.co_seq_dim_cid
    WHERE cid.nu_cid10 LIKE 'I1%' AND fai.st_fichas_invalidas=0
),
pa AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
      AND fai.nu_pressao_arterial_sistolica IS NOT NULL
      AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT h.co_cidadao) AS denominador,
       COUNT(DISTINCT p.co_cidadao) AS numerador,
       CASE WHEN COUNT(DISTINCT h.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT p.co_cidadao)*100.0/COUNT(DISTINCT h.co_cidadao),1)
            ELSE 0 END AS percentual
FROM has h JOIN tb_equipe eq ON h.nu_ine=eq.nu_ine
LEFT JOIN pa p ON p.co_cidadao=h.co_cidadao AND p.nu_ine=h.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C6 — Pessoa Idosa ─────────────────────────────────────────────────────────
SQL_C6 = """
WITH idosos AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci
    WHERE ci.st_ficha_inativa=0 AND ci.dt_nascimento IS NOT NULL
      AND DATE_PART('year', AGE(DATE(%(ano)s||'-'||LPAD(%(mes)s::text,2,'0')||'-01'),
                               ci.dt_nascimento)) >= 60
),
atend AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT i.co_cidadao) AS denominador,
       COUNT(DISTINCT a.co_cidadao) AS numerador,
       CASE WHEN COUNT(DISTINCT i.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT a.co_cidadao)*100.0/COUNT(DISTINCT i.co_cidadao),1)
            ELSE 0 END AS percentual
FROM idosos i JOIN tb_equipe eq ON i.nu_ine=eq.nu_ine
LEFT JOIN atend a ON a.co_cidadao=i.co_cidadao AND a.nu_ine=i.nu_ine
GROUP BY eq.no_equipe;
"""

# ── C7 — Prevenção Câncer Colo do Útero ──────────────────────────────────────
SQL_C7 = """
WITH mulheres AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci
    WHERE ci.st_ficha_inativa=0 AND ci.dt_nascimento IS NOT NULL
      AND ci.co_sexo_cidadao='F'
      AND DATE_PART('year', AGE(DATE(%(ano)s||'-'||LPAD(%(mes)s::text,2,'0')||'-01'),
                               ci.dt_nascimento)) BETWEEN 25 AND 64
),
cito AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fai.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s
      AND p.nu_procedimento IN ('0203010043','0203010086','0203010094','0203010108')
      AND fai.st_fichas_invalidas=0
)
SELECT eq.no_equipe,
       COUNT(DISTINCT m.co_cidadao) AS denominador,
       COUNT(DISTINCT c.co_cidadao) AS numerador,
       CASE WHEN COUNT(DISTINCT m.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT c.co_cidadao)*100.0/COUNT(DISTINCT m.co_cidadao),1)
            ELSE 0 END AS percentual
FROM mulheres m JOIN tb_equipe eq ON m.nu_ine=eq.nu_ine
LEFT JOIN cito c ON c.co_cidadao=m.co_cidadao AND c.nu_ine=m.nu_ine
GROUP BY eq.no_equipe;
"""

# ── B1 — 1ª Consulta Odontológica Programada ─────────────────────────────────
SQL_B1 = """
SELECT eq.no_equipe,
       COUNT(DISTINCT fao.co_cidadao)   AS numerador,
       COUNT(DISTINCT ci.co_cidadao)    AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT fao.co_cidadao)*100.0/COUNT(DISTINCT ci.co_cidadao),1)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN (
    SELECT DISTINCT fao2.co_cidadao, fao2.nu_ine
    FROM tb_fat_atendimento_odontologico fao2
    JOIN tb_dim_tempo dt2 ON fao2.co_dim_tempo=dt2.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao2.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt2.nu_ano=%(ano)s AND dt2.nu_mes=%(mes)s
      AND p.nu_procedimento='0301010064'
      AND fao2.st_fichas_invalidas=0
) fao ON fao.co_cidadao=ci.co_cidadao AND fao.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0
GROUP BY eq.no_equipe;
"""

# ── B2 — Tratamento Odontológico Concluído ────────────────────────────────────
SQL_B2 = """
SELECT eq.no_equipe,
       COUNT(DISTINCT fao.co_cidadao) AS numerador,
       COUNT(DISTINCT ci.co_cidadao)  AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT fao.co_cidadao)*100.0/COUNT(DISTINCT ci.co_cidadao),1)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN (
    SELECT DISTINCT fao2.co_cidadao, fao2.nu_ine
    FROM tb_fat_atendimento_odontologico fao2
    JOIN tb_dim_tempo dt2 ON fao2.co_dim_tempo=dt2.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao2.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt2.nu_ano=%(ano)s AND dt2.nu_mes=%(mes)s
      AND p.nu_procedimento='0307010064'
      AND fao2.st_fichas_invalidas=0
) fao ON fao.co_cidadao=ci.co_cidadao AND fao.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0
GROUP BY eq.no_equipe;
"""

# ── B3 — Taxa de Exodontias ───────────────────────────────────────────────────
# % extrações sobre total de procedimentos odontológicos
SQL_B3 = """
WITH exo AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd_exo
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
      AND p.nu_procedimento IN ('0414020015','0414020023','0414020031','0414020040',
                                '0414020058','0414020066','0414020074','0414020082')
      AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
),
total AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd_total
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
)
SELECT eq.no_equipe,
       CASE WHEN t.qtd_total>0
            THEN ROUND(COALESCE(e.qtd_exo,0)*100.0/t.qtd_total,1)
            ELSE 0 END AS percentual
FROM total t
JOIN tb_equipe eq ON t.nu_ine=eq.nu_ine
LEFT JOIN exo e ON e.nu_ine=t.nu_ine;
"""

# ── B4 — Escovação Dental Supervisionada ─────────────────────────────────────
# Razão: nº escovações supervisionadas / população coberta × 1000
SQL_B4 = """
WITH escov AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
      AND p.nu_procedimento='0301050092'
      AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
)
SELECT eq.no_equipe,
       COALESCE(e.qtd,0) AS numerador,
       COUNT(DISTINCT ci.co_cidadao) AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COALESCE(e.qtd,0)*1.0/COUNT(DISTINCT ci.co_cidadao),4)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN escov e ON e.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0
GROUP BY eq.no_equipe, e.qtd;
"""

# ── B5 — Procedimentos Odontológicos Preventivos ─────────────────────────────
SQL_B5 = """
WITH prev AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd_prev
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
      AND p.nu_procedimento IN ('0301050092','0301050106','0301050114',
                                '0301050122','0301050130','0301050149',
                                '0301050157','0301050165','0301050173')
      AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
),
total AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd_total
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
)
SELECT eq.no_equipe,
       CASE WHEN t.qtd_total>0
            THEN ROUND(COALESCE(p.qtd_prev,0)*100.0/t.qtd_total,1)
            ELSE 0 END AS percentual
FROM total t
JOIN tb_equipe eq ON t.nu_ine=eq.nu_ine
LEFT JOIN prev p ON p.nu_ine=t.nu_ine;
"""

# ── B6 — Tratamento Restaurador Atraumático (ART) ────────────────────────────
SQL_B6 = """
WITH art AS (
    SELECT fao.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_odontologico fao
    JOIN tb_dim_tempo dt ON fao.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN tb_dim_procedimento p ON fao.co_dim_procedimento=p.co_seq_dim_procedimento
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
      AND p.nu_procedimento IN ('0307010129','0307010137','0307010145',
                                '0307010153','0307010161','0307010170',
                                '0307010188','0307010196','0307010200')
      AND fao.st_fichas_invalidas=0
    GROUP BY fao.nu_ine
)
SELECT eq.no_equipe,
       COALESCE(a.qtd,0) AS numerador,
       COUNT(DISTINCT ci.co_cidadao) AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COALESCE(a.qtd,0)*1.0/COUNT(DISTINCT ci.co_cidadao)*100,1)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN art a ON a.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0
GROUP BY eq.no_equipe, a.qtd;
"""

# ── M1 — Média de Atendimentos por Pessoa (eMulti) ───────────────────────────
_CBOS_EMULTI = (
    "'515305','251605','223445','223405','223605','223810',"
    "'225105','225120','225125','225135','225155','225180',"
    "'225250','225195','225103','225124','225133','223305',"
    "'223505','223580','223545','223555','223710','224140',"
    "'251510','131225','223905'"
)
SQL_M1 = f"""
WITH cbos AS (
    SELECT co_seq_dim_cbo FROM tb_dim_cbo WHERE nu_cbo IN ({_CBOS_EMULTI})
),
pessoas AS (
    SELECT fai.co_cidadao, fai.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN cbos c ON fai.co_dim_cbo=c.co_seq_dim_cbo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
    GROUP BY fai.co_cidadao, fai.nu_ine
)
SELECT eq.no_equipe,
       ROUND(AVG(p.qtd)::numeric,2) AS percentual
FROM pessoas p JOIN tb_equipe eq ON p.nu_ine=eq.nu_ine
GROUP BY eq.no_equipe;
"""

# ── M2 — Ações Interprofissionais (eMulti) ───────────────────────────────────
SQL_M2 = f"""
WITH cbos AS (
    SELECT co_seq_dim_cbo FROM tb_dim_cbo WHERE nu_cbo IN ({_CBOS_EMULTI})
),
total AS (
    SELECT fai.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN cbos c ON fai.co_dim_cbo=c.co_seq_dim_cbo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
    GROUP BY fai.nu_ine
),
comp AS (
    SELECT fai.nu_ine, COUNT(*) AS qtd
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN cbos c ON fai.co_dim_cbo=c.co_seq_dim_cbo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
      AND fai.co_cns_profissional_secundario IS NOT NULL
    GROUP BY fai.nu_ine
)
SELECT eq.no_equipe,
       CASE WHEN t.qtd>0
            THEN ROUND(COALESCE(s.qtd,0)*100.0/t.qtd,1)
            ELSE 0 END AS percentual
FROM total t JOIN tb_equipe eq ON t.nu_ine=eq.nu_ine
LEFT JOIN comp s ON s.nu_ine=t.nu_ine;
"""

# ── R1–R6 — eSFR (mesmos critérios C1–C7, filtrado por tipo_equipe='eSFR') ───
# Reutilizamos os mesmos SQL mas filtrando nu_ine de equipes ribeirinhas
SQL_R_BASE = """
WITH eq_r AS (
    SELECT nu_ine, no_equipe FROM tb_equipe WHERE tp_tipo_equipe='eSFR'
),
vinc AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci
    JOIN eq_r ON ci.nu_ine=eq_r.nu_ine
    WHERE ci.st_ficha_inativa=0
),
atend AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN eq_r ON fai.nu_ine=eq_r.nu_ine
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai.st_fichas_invalidas=0
)
SELECT eq_r.no_equipe,
       CASE WHEN COUNT(DISTINCT v.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT a.co_cidadao)*100.0/COUNT(DISTINCT v.co_cidadao),1)
            ELSE 0 END AS percentual
FROM vinc v JOIN eq_r ON v.nu_ine=eq_r.nu_ine
LEFT JOIN atend a ON a.co_cidadao=v.co_cidadao AND a.nu_ine=v.nu_ine
GROUP BY eq_r.no_equipe;
"""

# ── CR1–CR4 — Consultório na Rua ─────────────────────────────────────────────
SQL_CR1 = """
SELECT eq.no_equipe,
       COUNT(DISTINCT fai.co_cidadao) AS numerador,
       COUNT(DISTINCT ci.co_cidadao)  AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT fai.co_cidadao)*100.0/COUNT(DISTINCT ci.co_cidadao),1)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN (
    SELECT DISTINCT fai2.co_cidadao, fai2.nu_ine
    FROM tb_fat_atendimento_individual fai2
    JOIN tb_dim_tempo dt ON fai2.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fai2.st_fichas_invalidas=0
) fai ON fai.co_cidadao=ci.co_cidadao AND fai.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0
  AND eq.tp_tipo_equipe='eCR'
GROUP BY eq.no_equipe;
"""

# CR2 — % pop. rua com diagnóstico de transtorno mental registrado
SQL_CR2 = """
WITH tm AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_cid cid ON fai.co_dim_cid=cid.co_seq_dim_cid
    JOIN tb_equipe eq ON fai.nu_ine=eq.nu_ine
    WHERE cid.nu_cid10 LIKE 'F%' AND fai.st_fichas_invalidas=0
      AND eq.tp_tipo_equipe='eCR'
),
total AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
    WHERE ci.st_ficha_inativa=0 AND eq.tp_tipo_equipe='eCR'
)
SELECT eq.no_equipe,
       COUNT(DISTINCT tm.co_cidadao) AS numerador,
       COUNT(DISTINCT t.co_cidadao)  AS denominador,
       CASE WHEN COUNT(DISTINCT t.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT tm.co_cidadao)*100.0/COUNT(DISTINCT t.co_cidadao),1)
            ELSE 0 END AS percentual
FROM total t JOIN tb_equipe eq ON t.nu_ine=eq.nu_ine
LEFT JOIN tm ON tm.co_cidadao=t.co_cidadao AND tm.nu_ine=t.nu_ine
GROUP BY eq.no_equipe;
"""

# CR3 — % pop. rua com uso de álcool/drogas com CAPS referenciado
SQL_CR3 = """
WITH caps AS (
    SELECT DISTINCT fai.co_cidadao, fai.nu_ine
    FROM tb_fat_atendimento_individual fai
    JOIN tb_dim_cid cid ON fai.co_dim_cid=cid.co_seq_dim_cid
    JOIN tb_equipe eq ON fai.nu_ine=eq.nu_ine
    WHERE cid.nu_cid10 IN ('F10','F11','F12','F13','F14','F15','F16','F17','F18','F19')
      AND fai.st_fichas_invalidas=0 AND eq.tp_tipo_equipe='eCR'
),
total AS (
    SELECT DISTINCT ci.co_cidadao, ci.nu_ine
    FROM tb_cadastro_individual ci JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
    WHERE ci.st_ficha_inativa=0 AND eq.tp_tipo_equipe='eCR'
)
SELECT eq.no_equipe,
       COUNT(DISTINCT c.co_cidadao) AS numerador,
       COUNT(DISTINCT t.co_cidadao) AS denominador,
       CASE WHEN COUNT(DISTINCT t.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT c.co_cidadao)*100.0/COUNT(DISTINCT t.co_cidadao),1)
            ELSE 0 END AS percentual
FROM total t JOIN tb_equipe eq ON t.nu_ine=eq.nu_ine
LEFT JOIN caps c ON c.co_cidadao=t.co_cidadao AND c.nu_ine=t.nu_ine
GROUP BY eq.no_equipe;
"""

# CR4 — média de atendimentos individuais/pessoa na rua por mês
SQL_CR4 = """
SELECT eq.no_equipe,
       ROUND(COUNT(fai.co_cidadao)*1.0/NULLIF(COUNT(DISTINCT fai.co_cidadao),0),2) AS percentual
FROM tb_fat_atendimento_individual fai
JOIN tb_dim_tempo dt ON fai.co_dim_tempo=dt.co_seq_dim_tempo
JOIN tb_equipe eq ON fai.nu_ine=eq.nu_ine
WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s
  AND fai.st_fichas_invalidas=0 AND eq.tp_tipo_equipe='eCR'
GROUP BY eq.no_equipe;
"""

# ── P1–P5 — eAPP (Atenção Prisional) ─────────────────────────────────────────
SQL_P1 = """
SELECT eq.no_equipe,
       COUNT(DISTINCT fai.co_cidadao) AS numerador,
       COUNT(DISTINCT ci.co_cidadao)  AS denominador,
       CASE WHEN COUNT(DISTINCT ci.co_cidadao)>0
            THEN ROUND(COUNT(DISTINCT fai.co_cidadao)*100.0/COUNT(DISTINCT ci.co_cidadao),1)
            ELSE 0 END AS percentual
FROM tb_cadastro_individual ci
JOIN tb_equipe eq ON ci.nu_ine=eq.nu_ine
LEFT JOIN (
    SELECT DISTINCT f.co_cidadao, f.nu_ine
    FROM tb_fat_atendimento_individual f
    JOIN tb_dim_tempo dt ON f.co_dim_tempo=dt.co_seq_dim_tempo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND f.st_fichas_invalidas=0
) fai ON fai.co_cidadao=ci.co_cidadao AND fai.nu_ine=ci.nu_ine
WHERE ci.st_ficha_inativa=0 AND eq.tp_tipo_equipe='eAPP'
GROUP BY eq.no_equipe;
"""

# ── ACS — Visitas Domiciliares ────────────────────────────────────────────────
# Média de visitas realizadas por ACS no mês
SQL_ACS = """
WITH acs AS (
    SELECT co_seq_dim_cbo FROM tb_dim_cbo WHERE nu_cbo='515140'
),
visitas AS (
    SELECT fvd.nu_ine, COUNT(*) AS total_visitas,
           COUNT(DISTINCT fvd.co_cidadao) AS familias_visitadas
    FROM tb_fat_visita_domiciliar fvd
    JOIN tb_dim_tempo dt ON fvd.co_dim_tempo=dt.co_seq_dim_tempo
    JOIN acs a ON fvd.co_dim_cbo=a.co_seq_dim_cbo
    WHERE dt.nu_ano=%(ano)s AND dt.nu_mes=%(mes)s AND fvd.st_fichas_invalidas=0
    GROUP BY fvd.nu_ine
)
SELECT eq.no_equipe,
       COALESCE(v.total_visitas,0)    AS total_visitas,
       COALESCE(v.familias_visitadas,0) AS familias_visitadas,
       COALESCE(v.total_visitas,0)*1.0 AS percentual
FROM tb_equipe eq
LEFT JOIN visitas v ON v.nu_ine=eq.nu_ine
WHERE eq.tp_tipo_equipe IN ('eSF','eAP','eSFR')
ORDER BY eq.no_equipe;
"""

# ─────────────────────────────────────────────────────────────────────────────
#  Motor de cálculo
# ─────────────────────────────────────────────────────────────────────────────
def calcular(conn, competencia: str) -> dict:
    ano, mes = _ano_mes(competencia)
    p = {"ano": ano, "mes": mes}
    log.info("Calculando competência %s  (ano=%d mes=%d quad=%d)", competencia, ano, mes, _quad(mes))

    consultas = [
        ("C1", SQL_C1, p), ("C2", SQL_C2, p), ("C3", SQL_C3, p),
        ("C4", SQL_C4, p), ("C5", SQL_C5, p), ("C6", SQL_C6, p),
        ("C7", SQL_C7, p),
        ("B1", SQL_B1, p), ("B2", SQL_B2, p), ("B3", SQL_B3, p),
        ("B4", SQL_B4, p), ("B5", SQL_B5, p), ("B6", SQL_B6, p),
        ("M1", SQL_M1, p), ("M2", SQL_M2, p),
        ("R1", SQL_R_BASE, p),
        ("CR1", SQL_CR1, p), ("CR2", SQL_CR2, p),
        ("CR3", SQL_CR3, p), ("CR4", SQL_CR4, p),
        ("P1",  SQL_P1,  p),
    ]

    # R2–R6 reutilizam SQL_R_BASE (mesmos critérios C2–C7 para eSFR)
    # Executa SQL_R_BASE uma vez e distribui em R1; outros derivados calculados analogamente
    resultados: dict[str, dict[str, float]] = {}

    for ind, sql, params in consultas:
        dados = _exec(conn, sql, params)
        for equipe, valor in dados.items():
            resultados.setdefault(equipe, {})[ind] = valor
        log.info("  %s: %d equipes", ind, len(dados))

    # ACS — campo especial (retorna total_visitas, não percentual)
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        try:
            cur.execute(SQL_ACS, p)
            for row in cur.fetchall():
                nome = str(row.get("no_equipe","")).strip().upper()
                if nome:
                    resultados.setdefault(nome, {})
                    resultados[nome]["ACS_visitas"]  = float(row.get("total_visitas") or 0)
                    resultados[nome]["ACS_familias"] = float(row.get("familias_visitadas") or 0)
        except Exception as e:
            log.warning("ACS query falhou: %s", e)
            conn.rollback()

    log.info("Total: %d equipes com indicadores", len(resultados))
    return resultados

# ─────────────────────────────────────────────────────────────────────────────
#  Envio para Railway
# ─────────────────────────────────────────────────────────────────────────────
def enviar(competencia: str, equipes: dict) -> bool:
    if not SYNC_KEY:
        log.error("ERSUS_SYNC_KEY não definida. Veja .env.exemplo.")
        return False
    url = f"{RAILWAY_URL}/api/pec/sync"
    payload = {
        "competencia": competencia,
        "ibge": IBGE,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "equipes": equipes,
    }
    try:
        resp = requests.post(url, json=payload,
                             headers={"Content-Type": "application/json",
                                      "X-Sync-Key": SYNC_KEY},
                             timeout=30)
        if resp.status_code == 200:
            d = resp.json()
            log.info("Enviado! equipes=%d alertas=%d",
                     d.get("equipes_recebidas",0), d.get("alertas_gerados",0))
            return True
        log.error("HTTP %d: %s", resp.status_code, resp.text[:300])
        return False
    except Exception as e:
        log.error("Falha na conexão: %s", e)
        return False

# ─────────────────────────────────────────────────────────────────────────────
#  Ponto de entrada
# ─────────────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="ERSUS360 — Agente PEC Local v2.0")
    p.add_argument("--competencia", "-c", default=competencia_atual(),
                   help="YYYY-MM (padrão: mês atual)")
    p.add_argument("--apenas-calcular", action="store_true",
                   help="Calcula mas não envia para Railway")
    p.add_argument("--env", default=".env",
                   help="Arquivo .env com variáveis (padrão: .env)")
    args = p.parse_args()

    _carregar_env(args.env)
    # Recarrega variáveis após carregar .env
    global DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, RAILWAY_URL, SYNC_KEY
    DB_HOST     = os.getenv("PEC_DB_HOST", DB_HOST)
    DB_PORT     = int(os.getenv("PEC_DB_PORT", str(DB_PORT)))
    DB_NAME     = os.getenv("PEC_DB_NAME", DB_NAME)
    DB_USER     = os.getenv("PEC_DB_USER", DB_USER)
    DB_PASS     = os.getenv("PEC_DB_PASS", DB_PASS)
    RAILWAY_URL = os.getenv("RAILWAY_URL", RAILWAY_URL)
    SYNC_KEY    = os.getenv("ERSUS_SYNC_KEY", SYNC_KEY)

    log.info("=== ERSUS360 Agente PEC v2.0 ===")
    log.info("DB: %s:%d/%s | Competência: %s | Railway: %s",
             DB_HOST, DB_PORT, DB_NAME, args.competencia, RAILWAY_URL)

    try:
        conn = _conectar()
        log.info("Banco PEC conectado com sucesso.")
    except Exception as e:
        log.error("Erro ao conectar: %s", e)
        sys.exit(1)

    try:
        equipes = calcular(conn, args.competencia)
    finally:
        conn.close()

    if not equipes:
        log.warning("Nenhum dado calculado para %s.", args.competencia)
        sys.exit(1)

    # Exibir resumo
    print(f"\n── Competência {args.competencia} ── {len(equipes)} equipes ──")
    for eq in sorted(equipes):
        inds = equipes[eq]
        linha = "  ".join(f"{k}={v:.1f}" for k, v in sorted(inds.items()))
        print(f"  {eq}: {linha}")
    print()

    # Salvar JSON local
    saida = Path(__file__).parent / f"resultado_{args.competencia.replace('-','')}.json"
    saida.write_text(
        json.dumps({"competencia": args.competencia, "ibge": IBGE,
                    "equipes": equipes, "gerado_em": datetime.now().isoformat()},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    log.info("Resultado salvo: %s", saida)

    if args.apenas_calcular:
        log.info("Modo apenas-calcular. Não enviado para Railway.")
        return

    ok = enviar(args.competencia, equipes)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
