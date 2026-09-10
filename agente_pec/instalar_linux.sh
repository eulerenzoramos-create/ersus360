#!/bin/bash
# ERSUS360 — Instalação do Agente PEC (Linux/Ubuntu)
set -e

echo "============================================================"
echo "  ERSUS360 — Instalação do Agente PEC  (Linux)"
echo "============================================================"
echo

DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Verificar Python ───────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "ERRO: python3 não encontrado."
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    exit 1
fi

# ── Instalar dependências ──────────────────────────────────────
echo "[1/4] Instalando dependências Python..."
pip3 install psycopg2-binary requests --quiet
echo "      OK"

# ── Criar .env ─────────────────────────────────────────────────
if [ ! -f "$DIR/.env" ]; then
    echo "[2/4] Criando arquivo .env..."
    cp "$DIR/.env.exemplo" "$DIR/.env"
    echo "      ATENÇÃO: Edite $DIR/.env com suas credenciais!"
else
    echo "[2/4] Arquivo .env já existe — mantido."
fi

# ── Testar cálculo ─────────────────────────────────────────────
echo "[3/4] Testando cálculo (sem envio ao Railway)..."
if ! python3 "$DIR/agente_pec.py" --apenas-calcular; then
    echo
    echo "ATENÇÃO: Verifique as credenciais em $DIR/.env"
    exit 1
fi

# ── Crontab (executa todo dia à meia-noite) ────────────────────
echo "[4/4] Configurando crontab..."
CRON_CMD="0 0 * * * python3 $DIR/agente_pec.py >> $DIR/agente_pec.log 2>&1"
# Remove entrada antiga se existir
(crontab -l 2>/dev/null | grep -v "agente_pec.py" ; echo "$CRON_CMD") | crontab -
echo "      Crontab configurado: executa diariamente às 00:00"

echo
echo "============================================================"
echo "  Instalação concluída!"
echo
echo "  Executar manualmente:"
echo "    python3 $DIR/agente_pec.py"
echo
echo "  Executar sem enviar:"
echo "    python3 $DIR/agente_pec.py --apenas-calcular"
echo
echo "  Ver log:"
echo "    tail -f $DIR/agente_pec.log"
echo "============================================================"
