#!/bin/bash
# ERSUS 360 — Script de setup inicial no Hetzner (Ubuntu 24.04)
# Execute como root: bash setup-hetzner.sh ersus360.seudominio.com.br
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Uso: bash setup-hetzner.sh SEU_DOMINIO.com.br"
  exit 1
fi

echo "==> [1/7] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

echo "==> [2/7] Instalando Docker..."
apt-get install -y -qq ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> [3/7] Configurando firewall (ufw)..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "==> [4/7] Clonando repositório..."
apt-get install -y -qq git
git clone https://github.com/eulerenzoramos-create/ersus360.git /opt/ersus360
cd /opt/ersus360

echo "==> [5/7] Configurando variáveis de ambiente..."
if [ ! -f .env.prod ]; then
  cp .env.prod.example .env.prod
  # Gera SECRET_KEY aleatória
  SECRET=$(openssl rand -hex 32)
  sed -i "s|GERE_COM_openssl_rand_hex_32|$SECRET|g" .env.prod
  # Coloca o domínio no CORS
  sed -i "s|SEU_DOMINIO.com.br|$DOMAIN|g" .env.prod
  echo ""
  echo "ATENÇÃO: Edite /opt/ersus360/.env.prod com as senhas reais antes de continuar!"
  echo "         nano /opt/ersus360/.env.prod"
  echo ""
fi

echo "==> [6/7] Configurando Nginx com domínio $DOMAIN..."
sed -i "s|SEU_DOMINIO.com.br|$DOMAIN|g" nginx/conf.d/ersus360.conf

echo "==> [7/7] Configuração concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Edite as variáveis: nano /opt/ersus360/.env.prod"
echo "  2. Suba os serviços: cd /opt/ersus360 && docker compose -f docker-compose.prod.yml up -d"
echo "  3. Aguarde o backend iniciar: docker compose -f docker-compose.prod.yml logs -f backend"
echo "  4. Obtenha SSL: docker compose -f docker-compose.prod.yml exec certbot certbot certonly \\"
echo "       --webroot -w /var/www/certbot -d $DOMAIN --email seu@email.com --agree-tos --no-eff-email"
echo "  5. Reinicie o nginx: docker compose -f docker-compose.prod.yml restart nginx"
echo ""
echo "Acesse: https://$DOMAIN"
