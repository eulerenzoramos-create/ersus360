#!/usr/bin/env python3
"""
Script SOMENTE LEITURA — confirma quantas equipes existem em tb_dim_equipe
(tabela de dimensao/BI) comparado com tb_equipe (tabela operacional).
Nao altera nada no banco.

Uso:
    python checar_dim_equipe.py
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

cur.execute("SELECT COUNT(*) FROM tb_equipe WHERE st_ativo = 1")
total_operacional = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM tb_dim_equipe")
total_dim = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM tb_dim_equipe WHERE st_registro_valido = 1")
total_dim_validas = cur.fetchone()[0]

cur.execute("SELECT co_seq_dim_equipe, nu_ine, no_equipe, st_registro_valido FROM tb_dim_equipe ORDER BY co_seq_dim_equipe")
todas = cur.fetchall()

with open("check_dim_equipe.txt", "w", encoding="utf-8") as f:
    f.write(f"Equipes ativas em tb_equipe (operacional): {total_operacional}\n")
    f.write(f"Linhas em tb_dim_equipe (dimensao/BI):      {total_dim}\n")
    f.write(f"  ...das quais validas (st_registro_valido=1): {total_dim_validas}\n\n")
    f.write("Conteudo completo de tb_dim_equipe:\n")
    for row in todas:
        f.write(f"  {row}\n")

conn.close()
print("OK — arquivo check_dim_equipe.txt gerado nesta pasta.")
