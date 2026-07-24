# PCPhone — Virtual Phone System

A cloud-based virtual phone system that gives you a consistent phone identity accessible from anywhere via the internet. Like eService Global, RingCentral, or Twilio Flex.

## Architecture Overview

```
Mobile App (React Native + WebRTC)
       │
       ▼
Backend API (Node.js + Express + TypeScript)
       │
       ▼
PostgreSQL ─── Redis ─── Twilio (PSTN) ─── S3 Storage
```

## Project Structure

```
pcphone/
├── docs/                # Design documentation
│   ├── 01-architecture.md
│   ├── 02-tech-stack.md
│   ├── 03-api-design.md
│   ├── 04-data-models.md
│   ├── 05-auth-security.md
│   └── 06-implementation-roadmap.md
├── backend/             # Node.js + Express API server
│   └── src/
│       ├── config/      # Environment configuration
│       ├── db/schema/   # Drizzle ORM schema definitions
│       ├── modules/     # Feature modules (auth, calls, etc.)
│       ├── webhooks/    # Twilio webhook handlers
│       ├── middleware/  # Express middleware
│       ├── services/    # Shared services (Twilio, Push, S3)
│       └── utils/       # Helpers
├── mobile/              # React Native (Expo) app
│   ├── app/             # Expo Router pages
│   ├── components/      # Shared UI components
│   ├── services/        # API, SIP, WebRTC services
│   ├── stores/          # Zustand state management
│   └── hooks/           # Custom React hooks
├── docker-compose.yml   # Local development environment
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Twilio account (for PSTN features)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Database
```bash
docker-compose up -d postgres redis
npm run db:generate
npm run db:migrate
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

## Key Features

- **Virtual Phone Number**: Get a real phone number that follows you anywhere
- **Make/Receive Calls**: Over internet (VoIP) via WebRTC + SIP
- **SMS/MMS**: Send and receive text messages
- **Voicemail**: With transcription
- **Call Forwarding**: Always, busy, no answer, unavailable
- **Call History**: Complete CDR with recordings
- **Contacts**: Sync and manage contacts
- **Multi-Device**: Use from any device simultaneously

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis |
| PSTN | Twilio |
| Mobile | React Native (Expo) + WebRTC + SIP.js |
| Auth | JWT + bcrypt |
| Storage | S3-compatible |
| Deployment | Docker + VPS/AWS |

## License

Private — All rights reserved.
