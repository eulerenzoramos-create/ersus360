#!/usr/bin/env python3
"""
Diagnostico SOMENTE LEITURA — mapeia o schema real do e-SUS PEC para os
indicadores C2, C3, C4, C6 e C7 do pec_sync.py.

Le apenas information_schema, contagens de linhas e tabelas de REFERENCIA
(dimensoes de procedimento/CIAP/tipo de atendimento). Nao le dados de
pacientes e nao altera nada no banco.

Uso:
    python explorar_indicadores.py
Gera: explorar_indicadores.txt (nesta pasta, ignorado pelo git)
"""
import os
from pathlib import Path

env_file = Path(__file__).parent / ".env"
for line in env_file.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        os.environ[k.strip()] = v.strip()

import psycopg2

conn = psycopg2.connect(
    host=os.getenv("PEC_DB_HOST", "localhost"),
    port=int(os.getenv("PEC_DB_PORT", "5433")),
    dbname=os.getenv("PEC_DB_NAME", "esus"),
    user=os.getenv("PEC_DB_USER", "esus"),
    password=os.getenv("PEC_DB_PASS", ""),
    connect_timeout=10,
)
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor()

out = open("explorar_indicadores.txt", "w", encoding="utf-8")


def w(s=""):
    out.write(s + "\n")


def tabela_existe(t):
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s", (t,))
    return cur.fetchone() is not None


def colunas(t):
    if not tabela_existe(t):
        w(f"=== {t}: NAO EXISTE ===\n")
        return
    cur.execute("""
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s ORDER BY ordinal_position
    """, (t,))
    rows = cur.fetchall()
    w(f"=== {t} ({len(rows)} colunas) ===")
    for c, ty in rows:
        w(f"  {c}: {ty}")
    w()


def contar(t):
    if not tabela_existe(t):
        return None
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    return cur.fetchone()[0]


# 1) Tabelas por padrao de nome ---------------------------------------------
w("##### TABELAS POR PADRAO DE NOME #####")
padroes = ["%procedimento%", "%atend_prof%", "%gestante%", "%puerper%", "%puericultura%",
           "%idoso%", "%prontuario%", "%citopatol%", "%hemoglobina%", "%tb_atend%", "%tb_dim_cid%"]
for p in padroes:
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_name ILIKE %s ORDER BY 1
    """, (p,))
    nomes = [r[0] for r in cur.fetchall()]
    w(f"-- {p}: {', '.join(nomes) if nomes else '(nenhuma)'}")
w()

# 2) Colunas das tabelas candidatas -----------------------------------------
w("##### COLUNAS #####")
candidatas = [
    "tb_prontuario", "tb_atend", "tb_atend_prof", "tb_exame_hemoglobina_glicada",
    "tb_sol_exame_citopatologico", "tb_fat_atd_ind_procedimentos", "tb_dim_procedimento",
    "tb_dim_cid", "tb_dim_tipo_atendimento", "tb_dim_tipo_ficha", "tb_cidadao_vinculacao_equipe",
]
for t in candidatas:
    colunas(t)

# 3) Contagens (so numeros) --------------------------------------------------
w("##### CONTAGENS DE LINHAS #####")
for t in ["tb_cidadao", "tb_prontuario", "tb_problema", "tb_pre_natal", "tb_fat_atendimento_individual",
          "tb_fat_atd_ind_problemas", "tb_fat_atd_ind_procedimentos", "tb_exame_requisitado",
          "tb_exame_hemoglobina_glicada", "tb_sol_exame_citopatologico", "tb_cidadao_vinculacao_equipe",
          "tb_fat_cidadao_pec"]:
    w(f"  {t}: {contar(t)}")
w()

# 4) Tabelas de referencia (sem dados de paciente) --------------------------
def amostra(titulo, sql, params=None):
    try:
        cur.execute(sql, params)
        cols = [d[0] for d in cur.description]
        w(f"=== {titulo} ===")
        w("  colunas: " + ", ".join(cols))
        for r in cur.fetchall():
            w(f"  {r}")
        w()
    except Exception as exc:
        w(f"=== {titulo}: erro {exc} ===\n")


w("##### REFERENCIAS #####")
amostra("tb_dim_tipo_atendimento", "SELECT * FROM tb_dim_tipo_atendimento ORDER BY 1 LIMIT 30")
amostra("tb_dim_situacao_problema", "SELECT * FROM tb_dim_situacao_problema ORDER BY 1 LIMIT 30")
amostra("tb_dim_ciap (gravidez/HAS/DM)", """
    SELECT * FROM tb_dim_ciap
    WHERE nu_ciap IN ('K86','K87','K85','T89','T90','W78','W79','W84','W71','W72')
    ORDER BY nu_ciap
""")
amostra("tb_dim_faixa_etaria", "SELECT * FROM tb_dim_faixa_etaria ORDER BY 1 LIMIT 40")
if tabela_existe("tb_dim_procedimento"):
    amostra("tb_dim_procedimento: total de linhas", "SELECT COUNT(*) FROM tb_dim_procedimento")
    for termo in ["desenvolvimento", "multidimensional", "idos", "citopatol", "hemoglobina",
                  "glicada", "pre-natal", "puerp", "pressao arterial", "avaliacao"]:
        amostra(f"tb_dim_procedimento contendo '{termo}'", f"""
            SELECT co_seq_dim_procedimento, co_proced, ds_proced
            FROM tb_dim_procedimento
            WHERE ds_filtro ILIKE '%{termo}%' OR ds_proced ILIKE '%{termo}%'
            ORDER BY co_proced LIMIT 25
        """)

out.close()
conn.close()
print("OK - explorar_indicadores.txt gerado nesta pasta.")
