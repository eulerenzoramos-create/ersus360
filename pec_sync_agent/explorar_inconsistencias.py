#!/usr/bin/env python3
"""
Script de diagnostico SOMENTE LEITURA — descobre em que tabelas o e-SUS PEC guarda o
"Relatorio de inconsistencias" do recebimento de fichas (lotes de integracao/LEDI), para
o painel de inconsistencias de envio do ERSUS360 nao depender de nome de tabela chutado.

Le so o CATALOGO do PostgreSQL (nomes de tabelas e colunas, pg_catalog) — nenhuma linha
de dado e lida, nenhum dado de cidadao sai daqui. Nao altera nada no banco.
Rodar primeiro no PEC de TREINAMENTO (dados ficticios).

Uso:
    python explorar_inconsistencias.py
Resultado: inconsistencias_schema.txt nesta pasta (pode ser enviado ao desenvolvedor).
"""
import os
from pathlib import Path

AQUI = Path(__file__).resolve().parent
env_file = AQUI / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ[k.strip()] = v.strip()

import psycopg2

# Termos do relatorio (slide "Relatorio de inconsistencia": data/tipo de recebimento, arquivo,
# lote, tipo de ficha, CNES/INE emitente, UUID, versao, validacoes negadas, erro estrutural)
TERMOS = ("inconsist", "lote", "recebiment", "transmiss", "transport", "importac", "validac",
          "rejeit", "erro", "ledi", "thrift", "dado_transp", "uuid_ficha", "ficha_recebida")

conn = psycopg2.connect(
    host=os.getenv("PEC_DB_HOST", "localhost"),
    port=int(os.getenv("PEC_DB_PORT", "5433")),
    dbname=os.getenv("PEC_DB_NAME", "esus"),
    user=os.getenv("PEC_DB_USER", "esus"),
    password=os.getenv("PEC_DB_PASS", ""),
    connect_timeout=10,
    options="-c client_encoding=UTF8",
)
conn.set_session(readonly=True)
cur = conn.cursor()

filtro = " OR ".join(["c.relname ILIKE %s"] * len(TERMOS))
cur.execute(f"""
    SELECT n.nspname, c.relname, c.relkind,
           has_table_privilege(c.oid, 'SELECT') AS pode_ler
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'v', 'm', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND ({filtro})
    ORDER BY 1, 2
""", tuple(f"%{t}%" for t in TERMOS))
tabelas = cur.fetchall()

saida = ["TABELAS CANDIDATAS AO RELATORIO DE INCONSISTENCIAS (so nomes, nenhum dado)", "=" * 72]
for esquema, nome, tipo, pode_ler in tabelas:
    cur.execute("""
        SELECT a.attname, format_type(a.atttypid, a.atttypmod)
        FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = %s AND c.relname = %s AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
    """, (esquema, nome))
    cols = ", ".join(f"{c} ({t})" for c, t in cur.fetchall())
    saida.append(f"\n{esquema}.{nome}  [{ {'r': 'tabela', 'v': 'view', 'm': 'view mat.', 'p': 'tabela part.'}[tipo] }]"
                 f"  leitura={'sim' if pode_ler else 'NAO'}")
    saida.append(f"    colunas: {cols}")

cur.close()
conn.close()
arq = AQUI / "inconsistencias_schema.txt"
arq.write_text("\n".join(saida) + "\n", encoding="utf-8")
print(f"{len(tabelas)} tabela(s) candidata(s). Resultado em {arq}")
