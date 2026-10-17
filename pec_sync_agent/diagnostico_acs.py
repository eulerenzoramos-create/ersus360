#!/usr/bin/env python3
"""
PEC_SYNC_AGENT — Diagnóstico de esquema para o Painel ACS  (SOMENTE LEITURA)

Descobre, no banco do e-SUS PEC deste servidor, os NOMES REAIS das tabelas e colunas
de que o Painel ACS precisa (equipes, profissionais/ACS, microáreas, cadastros
individuais e domiciliares, visitas domiciliares, grupos prioritários) e se o usuário
somente-leitura do agente (ersus_sync) já pode lê-las.

O que este script FAZ:
  - consulta apenas o catálogo do PostgreSQL (information_schema / has_*_privilege);
  - grava diagnostico_acs.txt nesta pasta;
  - envia ao ERSUS360 SÓ os nomes de tabelas/colunas, tipos e permissões.

O que este script NÃO faz:
  - não lê nenhuma linha de dados (nenhum cidadão, nenhum profissional);
  - não altera nada no banco (sessão read-only).

Uso (na pasta do agente, com o mesmo .env do pec_sync.py):
  python diagnostico_acs.py                       # diagnostica e envia ao ERSUS360
  python diagnostico_acs.py --nao-enviar          # só gera diagnostico_acs.txt
  python diagnostico_acs.py --pec-versao 5.5.28   # informa a versão do PEC (rodapé do login)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
_env = AQUI / ".env"
if _env.exists():
    for _l in _env.read_text(encoding="utf-8").splitlines():
        _l = _l.strip()
        if _l and not _l.startswith("#") and "=" in _l:
            _k, _, _v = _l.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

import psycopg2  # noqa: E402
import requests  # noqa: E402

VERSAO_AGENTE = "1.3.0-diag"
ERSUS_URL = os.getenv("ERSUS_URL", "https://ersus360-production.up.railway.app").rstrip("/")
ERSUS_KEY = os.getenv("ERSUS_SYNC_KEY", "")
IBGE = os.getenv("IBGE", "1300144")

# Padrões de nome procurados no schema public do PEC (só catálogo).
PADROES = [
    "%visita%", "%cad_individual%", "%cad_domiciliar%", "%cad_dom%", "%domicilio%", "%familia%",
    "%profissional%", "%lotacao%", "%micro%", "%territorio%", "%unidade_saude%", "%desfecho%",
    "tb_dim_cbo%", "%dim_equipe%", "tb_equipe%", "tb_dim_tempo%", "%acompanhamento%",
    "%condicao%", "%gestante%", "%pre_natal%", "%cidadao%",
]
LIMITE_TABELAS = 250


def conectar():
    conn = psycopg2.connect(
        host=os.getenv("PEC_DB_HOST", "localhost"), port=int(os.getenv("PEC_DB_PORT", "5433")),
        dbname=os.getenv("PEC_DB_NAME", "esus"), user=os.getenv("PEC_DB_USER", "esus"),
        password=os.getenv("PEC_DB_PASS", ""), connect_timeout=10, options="-c client_encoding=UTF8",
    )
    conn.set_session(readonly=True)
    return conn


def diagnosticar(conn) -> dict:
    cur = conn.cursor()
    cur.execute(
        "SELECT DISTINCT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type IN ('BASE TABLE', 'VIEW') "
        "AND (" + " OR ".join(["table_name ILIKE %s"] * len(PADROES)) + ") ORDER BY 1",
        PADROES,
    )
    tabelas = [r[0] for r in cur.fetchall()][:LIMITE_TABELAS]
    saida = {}
    for t in tabelas:
        cur.execute(
            "SELECT column_name, data_type, "
            "       has_column_privilege(current_user, quote_ident(table_schema) || '.' || quote_ident(table_name), column_name, 'SELECT') "
            "FROM information_schema.columns WHERE table_schema = 'public' AND table_name = %s "
            "ORDER BY ordinal_position",
            (t,),
        )
        colunas = [{"nome": c, "tipo": tp, "select": bool(pode)} for c, tp, pode in cur.fetchall()][:400]
        cur.execute("SELECT has_table_privilege(current_user, %s, 'SELECT')", (f"public.{t}",))
        saida[t] = {"colunas": colunas, "select_permitido": bool(cur.fetchone()[0])}
    cur.close()
    return saida


def gravar_txt(tabelas: dict, pec_versao: str | None) -> Path:
    arq = AQUI / "diagnostico_acs.txt"
    with open(arq, "w", encoding="utf-8") as f:
        f.write(f"DIAGNÓSTICO DE ESQUEMA — PAINEL ACS (somente catálogo, nenhum dado)\n")
        f.write(f"PEC versão: {pec_versao or 'não informada'} · agente {VERSAO_AGENTE} · IBGE {IBGE}\n")
        f.write("=" * 78 + "\n")
        for t, d in tabelas.items():
            f.write(f"\n{t}   [{'leitura liberada' if d['select_permitido'] else 'SEM leitura para o agente'}]\n")
            for c in d["colunas"]:
                f.write(f"   {'✓' if c['select'] else '·'} {c['nome']}  ({c['tipo']})\n")
    return arq


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nao-enviar", action="store_true")
    ap.add_argument("--pec-versao", default=os.getenv("PEC_VERSAO"))
    a = ap.parse_args()

    try:
        conn = conectar()
    except Exception as exc:  # noqa: BLE001
        print(f"ERRO ao conectar no banco do PEC: {exc}")
        sys.exit(1)
    tabelas = diagnosticar(conn)
    conn.close()
    arq = gravar_txt(tabelas, a.pec_versao)
    print(f"{len(tabelas)} tabelas descritas → {arq}")

    if a.nao_enviar:
        return
    if not ERSUS_KEY:
        print("ERSUS_SYNC_KEY não definida no .env — nada foi enviado (o arquivo local foi gerado).")
        return
    corpo = {"ibge": IBGE, "agente_versao": VERSAO_AGENTE, "pec_versao": a.pec_versao, "tabelas": tabelas}
    r = requests.post(f"{ERSUS_URL}/api/pec-agente/esquema", json=corpo,
                      headers={"X-Sync-Key": ERSUS_KEY}, timeout=30)
    if r.ok:
        print("Diagnóstico enviado ao ERSUS360:", json.dumps(r.json(), ensure_ascii=False))
    else:
        print(f"ERSUS360 respondeu {r.status_code}: {r.text[:300]}")


if __name__ == "__main__":
    main()
