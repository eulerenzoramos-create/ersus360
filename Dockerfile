# ── Stage 1: build do frontend ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build
# Resultado: /frontend/dist

# ── Stage 2: backend Python + frontend estático ────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc build-essential \
    wget curl gnupg ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m playwright install chromium --with-deps

COPY backend/ .

# Copia o build do frontend para dentro do container do backend
COPY --from=frontend-build /frontend/dist /app/frontend_dist

EXPOSE 8000

CMD ["bash", "start.sh"]
