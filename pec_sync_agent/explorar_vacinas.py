#!/usr/bin/env python3
"""
Diagnostico SOMENTE LEITURA — levanta as tabelas de REFERENCIA de vacinacao do
e-SUS PEC (imunobiologicos, doses, regras do calendario) para montar a boa
pratica E do C2 (vacinas do primeiro ano/2 anos). Nao le dados de pacientes e
nao altera nada.

Uso:
    python explorar_vacinas.py
Gera: explorar_vacinas.txt (nesta pasta, ignorado pelo git)
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
out = open("explorar_vacinas.txt", "w", encoding="utf-8")


def w(s=""):
    out.write(s + "\n")


def existe(t):
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s", (t,))
    return cur.fetchone() is not None


def colunas(t):
    if not existe(t):
        w(f"=== {t}: NAO EXISTE ===\n")
        return
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
        rows = cur.fetchall()
        w(f"=== {titulo} ({len(rows)} linhas) ===")
        w("  colunas: " + ", ".join(cols))
        for r in rows:
            w(f"  {r}")
        w()
    except Exception as exc:
        w(f"=== {titulo}: erro {exc} ===\n")


# Tabelas de REFERENCIA (calendario/doses/imunobiologicos). Nenhuma tem dado de paciente.
REFERENCIA = ["tb_imunobiologico", "tb_dose_imunobiologico", "tb_dim_dose_imunobiologico",
              "tb_dim_imunobiologico", "tb_regra_vacinal_dose", "tb_regra_vacinal_estrategia",
              "tb_calendario_vacinal", "tb_faixa_etaria_vacinacao", "tb_grupo_alvo_vacinacao",
              "tb_estrategia_vacinacao", "tb_classe_imunobiologico"]

w("##### COLUNAS DAS TABELAS DE REFERENCIA #####")
for t in REFERENCIA:
    colunas(t)

w("##### CONTEUDO (so referencia; limite 150 linhas cada) #####")
for t in REFERENCIA:
    if existe(t):
        amostra(t, f"SELECT * FROM {t} ORDER BY 1 LIMIT 150")

w("##### CONTAGENS DAS TABELAS FATO (so numeros) #####")
for t in ["tb_fat_vacinacao", "tb_fat_vacinacao_vacina", "tb_vacinacao", "tb_registro_vacinacao"]:
    if existe(t):
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        w(f"  {t}: {cur.fetchone()[0]}")

out.close()
conn.close()
print("OK - explorar_vacinas.txt gerado nesta pasta.")
