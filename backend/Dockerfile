FROM python:3.11-slim

WORKDIR /app

# Dependências do sistema (lxml, psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc build-essential \
    wget curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Frontend pré-buildado (Vite dist copiado em frontend_dist/ antes do push)
# Servido pelo FastAPI StaticFiles via main.py quando o diretório existir

EXPOSE 8000

CMD ["bash", "start.sh"]
