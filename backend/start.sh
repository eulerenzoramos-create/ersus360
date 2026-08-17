#!/bin/bash
# Instala Chromium do Playwright antes de subir o servidor
python -m playwright install chromium --with-deps 2>/dev/null || echo "Playwright chromium já instalado ou falhou (continuando)"
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --loop asyncio
