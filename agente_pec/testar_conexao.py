"""
ERSUS360 — Teste de Conexão
Execute antes do agente para verificar banco e Railway.

Uso:  python testar_conexao.py
      python testar_conexao.py --env .env
"""
import os, sys, argparse
from pathlib import Path

def _carregar_env(caminho):
    p = Path(caminho)
    if not p.exists():
        return
    for linha in p.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        k, _, v = linha.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

pa = argparse.ArgumentParser()
pa.add_argument("--env", default=".env")
args = pa.parse_args()
_carregar_env(args.env)

DB_HOST     = os.getenv("PEC_DB_HOST", "localhost")
DB_PORT     = int(os.getenv("PEC_DB_PORT", "5432"))
DB_NAME     = os.getenv("PEC_DB_NAME", "esus")
DB_USER     = os.getenv("PEC_DB_USER", "esus")
DB_PASS     = os.getenv("PEC_DB_PASS", "")
RAILWAY_URL = os.getenv("RAILWAY_URL", "https://ersus360-production.up.railway.app")
SYNC_KEY    = os.getenv("ERSUS_SYNC_KEY", "")

OK   = "  ✓"
FAIL = "  ✗"
ok_total = True

print("=" * 60)
print("  ERSUS360 — Teste de Conexão")
print("=" * 60)

# ── 1. psycopg2 ───────────────────────────────────────────────
print("\n[1] Dependências Python")
try:
    import psycopg2
    print(f"{OK} psycopg2  {psycopg2.__version__}")
except ImportError:
    print(f"{FAIL} psycopg2 não instalado → pip install psycopg2-binary")
    ok_total = False

try:
    import requests
    print(f"{OK} requests  {requests.__version__}")
except ImportError:
    print(f"{FAIL} requests não instalado → pip install requests")
    ok_total = False

# ── 2. Banco PEC ──────────────────────────────────────────────
print(f"\n[2] Banco PostgreSQL  ({DB_HOST}:{DB_PORT}/{DB_NAME})")
try:
    import psycopg2
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS, connect_timeout=8,
    )
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM tb_equipe;")
        n = cur.fetchone()[0]
    conn.close()
    print(f"{OK} Conectado  — {n} equipes em tb_equipe")
except Exception as e:
    print(f"{FAIL} Falha: {e}")
    print(f"     Verifique PEC_DB_HOST={DB_HOST}  PEC_DB_USER={DB_USER}  PEC_DB_PASS={'*' if DB_PASS else '(vazio)'}")
    ok_total = False

# ── 3. Railway ────────────────────────────────────────────────
print(f"\n[3] Railway ERSUS360  ({RAILWAY_URL})")
try:
    import requests
    r = requests.get(f"{RAILWAY_URL}/health", timeout=10)
    if r.status_code < 500:
        print(f"{OK} Acessível  — HTTP {r.status_code}")
    else:
        print(f"{FAIL} HTTP {r.status_code}")
        ok_total = False
except Exception as e:
    print(f"{FAIL} Sem acesso: {e}")
    ok_total = False

# ── 4. ERSUS_SYNC_KEY ─────────────────────────────────────────
print("\n[4] ERSUS_SYNC_KEY")
if SYNC_KEY:
    masked = SYNC_KEY[:6] + "****" + SYNC_KEY[-4:]
    print(f"{OK} Definida  ({masked})")
    # Testa a chave enviando um ping
    try:
        import requests, json
        r = requests.post(
            f"{RAILWAY_URL}/api/pec/sync",
            json={"competencia":"1900-01","ibge":"1300144",
                  "timestamp":"1900-01-01T00:00:00Z","equipes":{}},
            headers={"Content-Type":"application/json","X-Sync-Key": SYNC_KEY},
            timeout=10,
        )
        if r.status_code in (200, 400, 422):
            print(f"{OK} Chave aceita pelo Railway  (HTTP {r.status_code})")
        elif r.status_code == 401:
            print(f"{FAIL} Chave INVÁLIDA — HTTP 401  (verifique ERSUS_SYNC_KEY no .env)")
            ok_total = False
        else:
            print(f"  ? HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"  ? Não foi possível testar chave: {e}")
else:
    print(f"{FAIL} ERSUS_SYNC_KEY não definida")
    print(f"     Copie do Railway → Variables → ERSUS_SYNC_KEY")
    ok_total = False

# ── Resultado ─────────────────────────────────────────────────
print("\n" + "=" * 60)
if ok_total:
    print("  TUDO OK — Execute:  python agente_pec.py")
else:
    print("  ATENÇÃO: Corrija os itens com ✗ acima antes de executar.")
print("=" * 60 + "\n")
sys.exit(0 if ok_total else 1)
