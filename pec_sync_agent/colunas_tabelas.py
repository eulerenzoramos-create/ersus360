#!/usr/bin/env python3
"""
Script de diagnostico SOMENTE LEITURA — descobre nomes de colunas reais
no banco do e-SUS PEC configurado em .env, para corrigir as queries
de indicadores C1-C7 em pec_sync.py.

Nao faz nenhuma alteracao no banco. Roda so consultas em information_schema.

Uso:
    python colunas_tabelas.py
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
cur = conn.cursor()

cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name ILIKE '%prontuario%' OR table_name ILIKE 'tb_dim_equipe%'
           OR table_name ILIKE '%mchat%' OR table_name ILIKE '%desenvolv%'
           OR table_name ILIKE '%multidimensional%' OR table_name ILIKE '%amr%')
    ORDER BY 1
""")
tabelas_extra = [r[0] for r in cur.fetchall()]

with open("colunas_tabelas.txt", "w", encoding="utf-8") as f:
    f.write("=== TABELAS problema/condicao/ciap/avaliacao encontradas ===\n")
    for t in tabelas_extra:
        f.write(f"  {t}\n")
    f.write("\n")

    tabelas = [
        "tb_dim_equipe", "tb_dim_ciap", "tb_dim_cid10", "tb_dim_sexo",
        "tb_dim_faixa_etaria", "tb_fat_cidadao_pec", "tb_dim_tempo",
        "tb_dim_situacao_problema",
    ]

    vistos = set()
    for t in tabelas:
        if t in vistos:
            continue
        vistos.add(t)
        cur.execute("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema='public' AND table_name=%s
            ORDER BY ordinal_position
        """, (t,))
        rows = cur.fetchall()
        f.write(f"=== {t} ({len(rows)} colunas) ===\n")
        for col, typ in rows:
            f.write(f"  {col}: {typ}\n")
        f.write("\n")

    # Amostra de linhas (so estrutura/valores de referencia, sem dados de paciente)
    for t in ["tb_dim_equipe", "tb_dim_ciap"]:
        try:
            cur.execute(f"SELECT * FROM {t} LIMIT 3")
            colnames = [d[0] for d in cur.description]
            f.write(f"=== amostra {t} ===\n")
            f.write("  colunas: " + ", ".join(colnames) + "\n")
            for row in cur.fetchall():
                f.write(f"  {row}\n")
            f.write("\n")
        except Exception as exc:
            f.write(f"=== amostra {t}: erro {exc} ===\n\n")
            conn.rollback()

conn.close()
print("OK — arquivo colunas_tabelas.txt gerado nesta mesma pasta.")
print("Envie o conteudo desse arquivo de volta na conversa.")
