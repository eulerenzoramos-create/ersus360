#!/usr/bin/env python3
"""
Diagnostico SOMENTE LEITURA — levanta o schema real do e-SUS PEC para montar
a previa do C2 (Desenvolvimento Infantil): CBO, visitas domiciliares e
vacinacao. Le apenas information_schema, contagens e dimensoes de
referencia (CBO). Nao le dados de pacientes nem altera nada.

Uso:
    python explorar_c2.py
Gera: explorar_c2.txt (nesta pasta, ignorado pelo git)
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
out = open("explorar_c2.txt", "w", encoding="utf-8")


def w(s=""):
    out.write(s + "\n")


def existe(t):
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s", (t,))
    return cur.fetchone() is not None


w("##### TABELAS POR PADRAO #####")
for p in ["%cbo%", "%visita%", "%vacina%", "%imunobiologico%", "%tb_dim_profissional%"]:
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE %s ORDER BY 1", (p,))
    nomes = [r[0] for r in cur.fetchall()]
    w(f"-- {p}: {', '.join(nomes) if nomes else '(nenhuma)'}")
w()

w("##### COLUNAS #####")
candidatas = ["tb_dim_cbo", "tb_fat_visita_domiciliar", "tb_fat_vacinacao", "tb_fat_vacinacao_vacina",
              "tb_dim_imunobiologico", "tb_fat_cad_individual"]
cur.execute("""SELECT DISTINCT table_name FROM information_schema.tables
               WHERE table_schema='public' AND (table_name ILIKE '%vacina%' AND table_name ILIKE 'tb_fat%')""")
candidatas += [r[0] for r in cur.fetchall() if r[0] not in candidatas]
for t in candidatas:
    if not existe(t):
        w(f"=== {t}: NAO EXISTE ===\n")
        continue
    cur.execute("""SELECT column_name, data_type FROM information_schema.columns
                   WHERE table_schema='public' AND table_name=%s ORDER BY ordinal_position""", (t,))
    rows = cur.fetchall()
    w(f"=== {t} ({len(rows)} colunas) ===")
    for c, ty in rows:
        w(f"  {c}: {ty}")
    w()


def amostra(titulo, sql):
    try:
        cur.execute(sql)
        cols = [d[0] for d in cur.description]
        w(f"=== {titulo} ===")
        w("  colunas: " + ", ".join(cols))
        for r in cur.fetchall():
            w(f"  {r}")
        w()
    except Exception as exc:
        w(f"=== {titulo}: erro {exc} ===\n")


w("##### REFERENCIAS (sem dados de paciente) #####")
if existe("tb_dim_cbo"):
    amostra("tb_dim_cbo (amostra)", "SELECT * FROM tb_dim_cbo ORDER BY 1 LIMIT 5")
    amostra("tb_dim_cbo: medicos/enfermeiros/ACS/TACS",
            """SELECT * FROM tb_dim_cbo
               WHERE nu_cbo LIKE '2251%' OR nu_cbo LIKE '2252%' OR nu_cbo LIKE '2235%'
                  OR nu_cbo LIKE '515105%' OR nu_cbo LIKE '322255%' OR nu_cbo LIKE '5151%'
               ORDER BY nu_cbo LIMIT 60""")
if existe("tb_dim_imunobiologico"):
    amostra("tb_dim_imunobiologico", "SELECT * FROM tb_dim_imunobiologico ORDER BY 1 LIMIT 80")
amostra("tb_dim_procedimento: peso/altura/crescimento",
        """SELECT co_seq_dim_procedimento, co_proced, ds_proced FROM tb_dim_procedimento
           WHERE co_proced IN ('0101040024','0101040083','0101040075','0301010026','0301010060','0301010250')
              OR ds_proced ILIKE '%crescimento%' OR ds_proced ILIKE '%antropom%' OR ds_proced ILIKE '%teleconsulta%'
           ORDER BY co_proced LIMIT 30""")

w("##### CONTAGENS #####")
for t in candidatas:
    if existe(t):
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        w(f"  {t}: {cur.fetchone()[0]}")

out.close()
conn.close()
print("OK - explorar_c2.txt gerado nesta pasta.")
