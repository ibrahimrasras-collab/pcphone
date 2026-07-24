# Technology Stack — Virtual Phone

## Backend Stack

| Category | Choice | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | JavaScript runtime |
| Language | TypeScript | 5.x | Type safety, better DX |
| Framework | Express.js | 4.x | HTTP server, routing, middleware |
| API Validation | Zod | 3.x | Schema validation, type inference |
| ORM | Drizzle ORM | latest | Type-safe SQL, lightweight, no magic |
| Database | PostgreSQL | 16 | Primary data store |
| Cache/Queue | Redis | 7.x | Session cache, pub/sub events |
| Auth | JWT (jsonwebtoken) | 9.x | Stateless auth tokens |
| Telephony | Twilio SDK | 4.x | PSTN, SMS, webhook parsing |
| Push | firebase-admin + apn | latest | Push notifications |
| File Storage | @aws-sdk/client-s3 | 3.x | Recording storage |
| Testing | Vitest | latest | Unit/integration tests |
| Logging | Pino | 8.x | Structured JSON logging |
| Validation | Zod | 3.x | Input/output validation |
| CI/CD | GitHub Actions | - | Automated testing/deploy |

## Mobile Stack

| Category | Choice | Purpose |
|---|---|---|
| Framework | React Native (Expo) | Cross-platform mobile development |
| Language | TypeScript | Type safety |
| Navigation | Expo Router | File-based routing |
| State | Zustand | Lightweight client state |
| UI | React Native Paper | Material Design components |
| WebRTC | react-native-webrtc | Media streaming |
| SIP | sip.js | SIP signaling over WebSocket |
| Call Mgmt | react-native-incall-manager | Audio routing, speaker |
| Push (iOS) | expo-notifications + PushKit | VoIP push handling |
| Push (Android) | expo-notifications + FCM | Call wake-up |
| Secure Storage | expo-secure-store | Token storage |
| Networking | axios | HTTP client |
| Testing | Jest + React Native Testing Library | Component testing |

## Infrastructure

| Category | Choice | Purpose |
|---|---|---|
| Container | Docker | Dev/prod parity |
| Orchestration | Docker Compose | Local multi-service setup |
| Reverse Proxy | Nginx | TLS, rate limiting, routing |
| Monitoring | Prometheus + Grafana | Metrics, dashboards |
| Log Aggregation | Loki (or ELK) | Log centralization |
| Deployment | VPS / AWS EC2 | Production hosting |
| CI/CD | GitHub Actions | Auto-build, test, deploy |
| SSL | Let's Encrypt + Certbot | Auto-renewing TLS certs |

## Third-Party Services

| Service | Purpose | Cost Model |
|---|---|---|
| Twilio | PSTN voice, SMS, SIP trunking | Pay-per-use (per min + per SMS) |
| Firebase | FCM push notifications | Free tier adequate |
| APNs | iOS push notifications | Free (Apple developer account req) |
| AWS S3 (or equiv) | Recording storage | Pay-per-GB/month |

## Why These Choices

### Twilio over Self-Hosted PBX
- **Pros**: No infrastructure to manage for PSTN connectivity, global DID availability, built-in SIP trunking, programmable webhooks
- **Cons**: Per-minute costs, vendor dependency
- **Mitigation**: Abstract Twilio behind a provider interface so we can switch to Telnyx/SignalWire later

### Express over Fastify/NestJS
- **Avoids lock-in** to opinionated frameworks
- **Middleware ecosystem** is mature and well-understood
- **Lightweight** for our webhook-heavy architecture
- Can migrate to Fastify later if performance demands

### Drizzle over Prisma
- **Lighter weight**, no generator step
- **SQL-like syntax** gives full control
- **Better performance** for complex telephony queries
- **Less memory overhead** in containerized env

### sip.js + WebRTC over Native SIP SDK
- **Cross-platform** with single codebase
- **No native bridge** complexity
- **Works with any SIP-compatible PBX** (vendor independence)
- Fallback: Bridge native SIP SDK if background reliability issues arise
