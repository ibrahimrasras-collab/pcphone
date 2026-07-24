# System Architecture — Virtual Phone (Cloud PBX)

## Overview
A cloud-based virtual phone system that lets users maintain a consistent phone identity accessible from anywhere via internet. Inspired by services like eService Global, RingCentral, and Twilio Flex.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (React Native)                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Call UI  │  │ Contacts  │  │ Messages │  │ Settings      │   │
│  │ (WebRTC) │  │           │  │ (SMS)    │  │ Voicemail     │   │
│  └────┬─────┘  └───────────┘  └──────────┘  └──────────────┘   │
│       │                        ▲                                │
│  ┌────┴────────────────────────┴────────────────────────────┐   │
│  │                SIP Client / WebRTC Stack                  │   │
│  │  (sip.js + react-native-webrtc + react-native-incall-    │   │
│  │   manager + PushKit/CallKit + FCM + ConnectionService)    │   │
│  └─────────────────────────┬─────────────────────────────────┘   │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    HTTPS / WSS │ Push Notifications
                             │
┌────────────────────────────┼───────────────────────────────────┐
│  ┌─────────────────────────┴─────────────────────────────────┐  │
│  │              REVERSE PROXY (Nginx / Cloudflare)            │  │
│  │         TLS Termination | Rate Limiting | Routing          │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────┴─────────────────────────────────┐  │
│  │              BACKEND API (Node.js + Express + TS)          │  │
│  │                                                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ Auth     │ │ User Mgt │ │ Call     │ │ CDR &        │ │  │
│  │  │ Service  │ │ & Ext    │ │ Control  │ │ Billing      │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ Voicemail│ │ SMS/MMS  │ │ Webhook  │ │ Admin        │ │  │
│  │  │ Service  │ │ Service  │ │ Handler  │ │ Dashboard    │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  └─────────────────────┬───────────────────────────────────┘  │
│                        │                                     │
│  ┌─────────────────────┴───────────────────────────────────┐  │
│  │              DATABASE (PostgreSQL)                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Users    │ │ Calls &  │ │ Billing  │ │ Voicemail  │  │  │
│  │  │ & Exts   │ │ CDR      │ │ Ledger   │ │ Store      │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────┴───────────────────────────────────┐  │
│  │              CPaaS / TELEPHONY LAYER                     │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │              TWILIO (PSTN Gateway)                │   │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │  │
│  │  │  │ Voice    │ │ SMS/MMS  │ │ Elastic SIP      │  │   │  │
│  │  │  │ Webhooks │ │ Webhooks │ │ Trunking          │  │   │  │
│  │  │  └──────────┘ └──────────┘ └──────────────────┘  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │        PUSH NOTIFICATION SERVICE                  │   │  │
│  │  │  ┌──────────┐ ┌──────────┐                      │   │  │
│  │  │  │ APNs     │ │ FCM      │                      │   │  │
│  │  │  │ (iOS)    │ │ (Android)│                      │   │  │
│  │  │  └──────────┘ └──────────┘                      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────┴───────────────────────────────────┐  │
│  │              OBJECT STORAGE (S3)                         │  │
│  │         Voicemail recordings | Call recordings            │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Architecture Principles

1. **Separation of Concerns**: API server handles business logic; Twilio handles PSTN signaling/media; mobile handles UI/audio
2. **Stateless API**: All backend servers are stateless; session state lives in database or JWT
3. **Event-Driven**: Telephony events flow via webhooks; internal events via message queue (Redis Pub/Sub or RabbitMQ)
4. **Defense in Depth**: TLS everywhere; JWT auth; SIP digest auth; rate limiting; input validation

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| PSTN Provider | Twilio | Global reach, managed infrastructure, rich API, no SIP trunking complexity |
| Backend Runtime | Node.js + TypeScript | Fast development, shared types with mobile, large ecosystem |
| Database | PostgreSQL | Reliable, JSONB for flexible config, strong ACID for billing |
| Mobile Framework | React Native (Expo) | Cross-platform, code sharing, rapid iteration |
| VoIP Client | sip.js + react-native-webrtc | Open source, standards-based SIP, no vendor lock-in |
| Push Notifications | APNs (iOS) + FCM (Android) | Native OS integration, required for call receipt |
| Object Storage | S3-compatible (AWS/MinIO) | Durable, cheap, scalable for recordings |
| Auth | JWT + Refresh Tokens | Stateless API auth, mobile-friendly |
| Real-time | Redis Pub/Sub | Lightweight, fast for internal event routing |
| Containerization | Docker + Docker Compose | Reproducible environments, easy deployment |

## Call Flow (Inbound)

```
1. PSTN call arrives at Twilio number
2. Twilio sends HTTP POST to /webhooks/voice/incoming
3. Backend looks up DID → user/extension → routing rules
4. Backend returns TwiML:
   - If user online: <Dial> with WebRTC client details
   - If offline: push notification via APNs/FCM
   - If no answer: forward to voicemail
5. Mobile app receives push → shows CallKit/ConnectionService UI
6. User answers → WebRTC media path established
7. CDR recorded on call completion
```

## Call Flow (Outbound)

```
1. User dials number in app
2. App sends POST /api/calls to backend
3. Backend creates CDR record, initiates Twilio call
4. Twilio calls user's WebRTC client first
5. When user answers, Twilio bridges to destination PSTN number
6. CDR updated on completion
```

## Component Responsibilities

| Component | Responsibility |
|---|---|
| Mobile App | UI, WebRTC media, SIP registration, push handling, local contacts |
| Backend API | User mgmt, call control, routing logic, CDR, billing, webhook processing |
| PostgreSQL | Persistent storage for users, extensions, calls, billing, config |
| Redis | Session cache, real-time events, rate limiting counters |
| Twilio | PSTN termination, media bridging, SIP trunking, SMS |
| Push Service | APNs + FCM delivery for incoming calls |
| Object Storage | Recordings archive |
