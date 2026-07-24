# PCPhone Setup Guide — Mobile + Laptop + PC

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Mobile App  │────▶│  Backend (Cloud) │────▶│ Twilio (PSTN)│
│ (React Ntv) │     │  Node.js + DB    │     │ Phone Network│
└─────────────┘     └──────────────────┘     └──────────────┘
┌─────────────┐           │
│ Laptop/PC   │◀──────────┘
│ (Web App)   │
└─────────────┘
```

## Prerequisites

- **Twilio account** (free trial gives $15 credit): https://www.twilio.com/try-twilio
- **Node.js 20+** on your laptop/PC
- **Docker Desktop** (optional, for local backend): https://www.docker.com/products/docker-desktop/
- **Expo Go** app on your phone (iOS/Android): https://expo.dev/go
- **A cloud server** or **ngrok** for public backend access

---

## Quick Start (Local Testing)

### Step 1: Clone & Install Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your Twilio credentials (get them from https://console.twilio.com):

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
JWT_SECRET=generate-a-long-random-string-here-at-least-32-chars
```

```bash
npm install
docker-compose up -d        # starts PostgreSQL + Redis
npm run db:generate
npm run db:migrate
npm run dev                  # starts backend on localhost:4000
```

### Step 2: Expose Backend Publicly (ngrok)

Since your phone needs to reach the backend over the internet:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 4000
```

This gives you a URL like `https://abc123.ngrok.io`. Copy it.

### Step 3: Configure & Run Mobile App

Open `mobile/utils/api.ts` and change the `API_BASE_URL` to your ngrok URL:

```typescript
const API_BASE_URL = "https://abc123.ngrok.io/api/v1";
```

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) → app runs on your phone.

For **laptop/PC**: Press `w` in the terminal to open the web version in your browser. Or scan the QR on your laptop's camera.

### Step 4: Buy a Phone Number (Twilio)

```bash
# Via Twilio Console: https://console.twilio.com
# Buy a number, then configure the Voice webhook URL:
# https://abc123.ngrok.io/webhooks/voice/incoming
```

---

## Full Deployment (Production — Works Everywhere)

### Backend → Cloud Server (Render / Railway / AWS)

**Option A: Render (Free tier, easiest)**

1. Push code to GitHub (done ✓)
2. Go to https://render.com → New Web Service
3. Connect your repo, set:
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
4. Add environment variables (from `.env`)
5. Add a PostgreSQL + Redis instance on Render
6. You get a URL like `https://pcphone.onrender.com`

**Option B: Railway (Free tier)**

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Add PostgreSQL + Redis plugins
3. Set env vars, deploy

### Mobile App → App Stores or Direct Install

**For testing (no store needed):**

```bash
cd mobile
npx expo build:android    # generates APK
npx expo build:ios        # generates IPA (needs Apple Developer)
```

Or use **EAS Build** for cloud builds:

```bash
npx eas build --platform android --profile preview
```

Install the APK on your phone directly.

**For laptop/PC (web app):**

```bash
cd mobile
npx expo export --platform web
```

This generates a `dist/` folder — deploy it to Netlify/Vercel for a web-based softphone.

---

## Using Across All 3 Devices

Once deployed, every device connects to the same backend:

| Device | How to Access |
|---|---|
| **Phone** | Expo Go (dev) or installed APK/IPA (prod) |
| **Laptop** | Open `http://localhost:8081` (dev) or deployed web URL |
| **PC** | Same as laptop — web browser or installed APK via Android emulator |

All devices share:
- Same phone number (Twilio DID)
- Same call history (CDR)
- Same voicemail inbox
- Same contacts
- Inbound calls ring on ALL devices simultaneously

---

## Environment Variables Reference (Backend `.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Random 32+ char string for auth tokens |
| `TWILIO_ACCOUNT_SID` | Yes | From Twilio console |
| `TWILIO_AUTH_TOKEN` | Yes | From Twilio console |
| `CORS_ORIGIN` | Yes | Your mobile/web app URL |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| App can't connect to backend | Check ngrok URL is correct; restart ngrok |
| Calls don't go through | Verify Twilio webhook URL points to your backend |
| Push notifications not working | Need APNs cert (iOS) or FCM key (Android) — skip for initial testing |
| "Invalid signature" from Twilio | Set correct `TWILIO_AUTH_TOKEN` in env |
| Expo QR not working on phone | Both devices must be on same WiFi (dev mode) |

---

## Next Features to Enable

1. **Push notifications** — wake phone on incoming call (requires APNs + FCM)
2. **Voicemail transcription** — add Deepgram/Whisper API key
3. **Call recording** — enable in Twilio console
4. **Multiple extensions** — for team/enterprise use
