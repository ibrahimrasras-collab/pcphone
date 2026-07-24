#!/bin/bash
# Production deployment script for VPS (DigitalOcean, AWS EC2, Hetzner, etc.)
# Run on a fresh Ubuntu 22.04+ server as the 'ubuntu' or 'root' user.

set -euo pipefail

# ===== Configuration =====
REPO_URL="https://github.com/ibrahimrasras-collab/pcphone.git"
APP_DIR="/opt/pcphone"
DOMAIN="pcphone.example.com"        # change to your domain
ACME_EMAIL="admin@example.com"

echo "========================================"
echo "  PCPhone Backend Production Setup"
echo "========================================"

# ===== 1. Install system dependencies =====
echo "[1/6] Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban \
  certbot python3-certbot-nginx

# ===== 2. Install Docker =====
if ! command -v docker &>/dev/null; then
  echo "[2/6] Installing Docker..."
  curl -fsSL https://get.docker.com | sudo bash
  sudo usermod -aG docker "$USER"
fi

# ===== 3. Clone repo =====
echo "[3/6] Cloning repository..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ===== 4. Set up environment file =====
echo "[4/6] Configuring environment..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Edit backend/.env with your secrets before continuing:"
  echo "  nano $APP_DIR/backend/.env"
  echo ""
  echo "Required values:"
  echo "  - DATABASE_URL (auto-filled by Docker Compose)"
  echo "  - JWT_SECRET  (generate a random 32-char string)"
  echo "  - TWILIO_ACCOUNT_SID"
  echo "  - TWILIO_AUTH_TOKEN"
  echo "  - CORS_ORIGIN = https://$DOMAIN"
  echo ""
  read -p "Press Enter when you've filled in .env..."
fi

# ===== 5. Start services =====
echo "[5/6] Starting Docker services..."
docker compose -f docker-compose.prod.yml up -d --build

# ===== 6. SSL certificate via Let's Encrypt =====
echo "[6/6] Setting up SSL..."
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "pcphone.example.com" ]; then
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ACME_EMAIL"
  echo "SSL certificate installed for $DOMAIN"
fi

# ===== Firewall =====
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# ===== Done =====
echo ""
echo "========================================="
echo "  Deployment complete!"
echo "========================================="
echo "  API:     https://$DOMAIN/api/v1"
echo "  Webhook: https://$DOMAIN/webhooks/voice/incoming"
echo ""
echo "  Configure Twilio webhook URL to:"
echo "    https://$DOMAIN/webhooks/voice/incoming"
echo ""
echo "  To view logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "  To restart:    docker compose -f docker-compose.prod.yml restart backend"
