# PCPhone Backend Deployment Guide

Choose one of three providers. Each takes ~10 minutes.

---

## Option A: Render (Easiest — Free Tier)

1. **Push code to GitHub** ✅ (already done)

2. Go to https://render.com → **New +** → **Blueprint**

3. Select your GitHub repo (`ibrahimrasras-collab/pcphone`)
   - Render auto-detects `render.yaml`
   - Creates: PostgreSQL, Redis, Backend service

4. Fill in the env vars marked `sync: false`:
   ```
   TWILIO_ACCOUNT_SID    = your account SID
   TWILIO_AUTH_TOKEN     = your auth token
   APNS_KEY_ID           = (optional, for iOS push)
   APNS_TEAM_ID          = (optional)
   FCM_SERVER_KEY        = (optional, for Android push)
   ```

5. Click **Apply** → wait ~5 min for build + deploy

6. Your backend is live at: `https://pcphone-api.onrender.com/api/v1/health`

7. **Configure Twilio webhook**:
   - Go to your Twilio number → Voice & Fax
   - Primary webhook: `https://pcphone-api.onrender.com/webhooks/voice/incoming`
   - Status callback: `https://pcphone-api.onrender.com/webhooks/voice/status`

8. **Set Render deploy hook** (optional, for auto-deploy on push):
   - Render → your service → Settings → Deploy Hook
   - Add it as `RENDER_DEPLOY_HOOK` secret in GitHub repo

---

## Option B: Railway (Free Trial)

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**

2. Select the `ibrahimrasras-collab/pcphone` repo

3. Railway detects `railway.toml` → choose `backend/Dockerfile`

4. Click **+ Add** → **Database** → PostgreSQL
   - Railway sets `DATABASE_URL` automatically

5. Click **+ Add** → **Database** → Redis
   - Railway sets `REDIS_URL` automatically

6. Open **Variables** tab → copy PostgreSQL URL → set as `DATABASE_URL` for backend

7. Add env vars:
   ```
   JWT_SECRET           = random 32-char string
   TWILIO_ACCOUNT_SID   = your account SID
   TWILIO_AUTH_TOKEN    = your auth token
   NODE_ENV             = production
   CORS_ORIGIN          = * (or your frontend domain)
   ```

8. Railway assigns a public URL like `https://pcphone-api.up.railway.app`

9. **Auto-deploy on every push to GitHub** ✅ wired automatically

---

## Option C: Fly.io (Best free TLS + global edge)

### Prerequisites
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- Sign in: `flyctl auth login`
- Add credit card (free $0 bill — needed for TLS certs)

### Deploy
```bash
cd D:\pcphone
flyctl launch --config fly.toml --no-deploy
# Answer "No" when asked to modify Dockerfile

# Set secrets
flyctl secrets set JWT_SECRET=$(openssl rand -hex 32)
flyctl secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
flyctl secrets set TWILIO_AUTH_TOKEN=xxxxxx
flyctl secrets set CORS_ORIGIN=https://myapp.example.com

# Attach Postgres cluster
flyctl postgres create --name pcphone-db
flyctl postgres attach pcphone-db

# Deploy
flyctl deploy --config fly.toml

# Verify
curl https://pcphone-api.fly.dev/api/v1/health
```

---

## Option D: Your Own VPS (Full Control)

For DigitalOcean, AWS EC2, Hetzner, Linode — disposable Ubuntu 22.04+ droplet.

### One-shot deployment:

```bash
# 1. Buy a server (e.g. $6 DigitalOcean droplet, Frankfurt/London region)
# 2. SSH in:
ssh root@your-server-ip

# 3. Edit the deployment script first:
nano /tmp/deploy.sh
# Change DOMAIN to your real domain
# Or download directly:
curl -fsSL https://raw.githubusercontent.com/ibrahimrasras-collab/pcphone/master/scripts/deploy.sh \
  | sudo bash -s -- --domain pcphone.your-domain.com
```

### Manual setup:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo bash

# Clone repo
git clone https://github.com/ibrahimrasras-collab/pcphone /opt/pcphone
cd /opt/pcphone

# Create .env
cp backend/.env.example backend/.env

# IMPORTANT: Generate a strong JWT_SECRET
openssl rand -hex 32 >> /dev/null  # copy this into .env

nano backend/.env

# Start everything
docker compose -f docker-compose.prod.yml up -d --build

# Set up free SSL via Let's Encrypt
sudo certbot --nginx -d pcphone.your-domain.com

# Verify
curl https://pcphone.your-domain.com/api/v1/health
# → {"status":"ok","timestamp":"..."}
```

### DNS configuration

Add an **A record** pointing your domain to the server's IP:
```
pcphone.example.com.   A   300   165.22.100.50
```

---

## Post-Deployment Checklist

After any provider, complete these steps:

1. ✅ Backend health check passes
2. ✅ Run database migrations
   ```bash
   docker compose exec backend npm run db:migrate
   # Or directly: docker exec -it pcphone-backend-1 npx drizzle-kit migrate
   ```
3. ✅ Buy Twilio phone number
   - Go to https://console.twilio.com → Phone Numbers → Buy
   - Pick one supporting Voice
4. ✅ Configure Twilio webhook:
   - Voice webhook: `https://your-domain/webhooks/voice/incoming`
   - Status callback: `https://your-domain/webhooks/voice/status`
5. ✅ Test inbound call: call your Twilio number from your mobile
6. ✅ Update mobile app config (`mobile/utils/config.ts`)
   ```typescript
   apiBaseUrl: "https://your-domain/api/v1"
   wsUrl: "wss://your-domain"
   ```
7. ✅ Rebuild mobile app and install
8. ✅ (Optional) Configure push notifications (APNs/FCM)

---

## Twilio Webhook URLs Reference

| Webhook | URL |
|---|---|
| Incoming voice call | `https://your-domain/webhooks/voice/incoming` |
| Call status changes | `https://your-domain/webhooks/voice/status` |
| Voicemail captures | `https://your-domain/webhooks/voice/voicemail` |
| Incoming SMS | `https://your-domain/webhooks/sms/incoming` |
| SMS delivery status | `https://your-domain/webhooks/sms/status` |

---

## Monitoring

| Provider | Logs | Metrics |
|---|---|---|
| Render | Dashboard → Logs | Dashboard → Metrics |
| Railway | Dashboard → Deployments → Logs | Built-in |
| Fly.io | `flyctl logs` | `flyctl status` |
| VPS | `docker compose logs -f backend` | Prometheus + Grafana (optional) |

## Cost Comparison (Lowest tier)

| Provider | Free Limits | Notes |
|---|---|---|
| Render | 750 hrs/month on free tier | Goes to sleep after 15 min idle |
| Railway | $5 trial credit | After trial: usage-based |
| Fly.io | Hobby $0/mo (small VMs) | Free TLS certs included |
| DigitalOcean | $4 droplet/mo | Full control |
| Hetzner | €4.51/mo | Cheapest European option |

---

## Verify your deployment

Once deployed, test from any shell:

```bash
# Health check
curl https://your-domain.com/api/v1/health

# Create a user
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234A","name":"Test User"}'

# Login
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234A"}'
```

You should receive JWT tokens in the response. Done ✅
