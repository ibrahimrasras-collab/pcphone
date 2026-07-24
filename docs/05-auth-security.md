# Authentication & Security — Virtual Phone

## Authentication Flow

### Registration
```
1. User submits email + password + name
2. Backend validates input (Zod schema)
3. Password hashed with bcrypt (cost factor 12)
4. User created → extension auto-assigned
5. JWT access token + refresh token generated
6. Tokens returned to client
```

### Login
```
1. User submits email + password
2. Backend verifies bcrypt hash
3. JWT access token (1h expiry) generated
4. Refresh token (30d expiry) generated & stored hashed in DB
5. Tokens returned to client
```

### Token Refresh
```
1. Client sends refresh token to POST /auth/refresh
2. Backend hashes refresh token, looks up in DB
3. Validates not expired
4. Generates new access token + rotates refresh token
5. Old refresh token invalidated
```

### Token Revocation
- Logout: Delete refresh token from DB
- Password change: Delete all refresh tokens for user
- Admin suspend: Delete all tokens, prevent new login

## JWT Token Structure

### Access Token
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "ext": "1001",
  "iat": 1680000000,
  "exp": 1680003600
}
```

### Refresh Token
- Random 64-byte value, base64url encoded
- Stored as SHA-256 hash in database
- Never transmitted in URL params

## Security Measures

### Password Policy
- Minimum 8 characters, max 128
- Require: uppercase, lowercase, number
- Optional: special character
- Bcrypt cost factor 12
- Rate limit: 10 attempts per IP per minute

### API Security
| Measure | Implementation |
|---|---|
| HTTPS | TLS 1.3, forced redirect |
| CORS | Whitelist specific origins |
| Rate Limiting | Per-IP + per-user tiers |
| Input Validation | Zod schemas on all inputs |
| SQL Injection | Parameterized queries via Drizzle |
| XSS | Content-Type enforcement, no HTML in responses |
| CSRF | Token-based, SameSite cookies |
| Helmet | Security headers (XSS, CSP, HSTS) |
| Auth | JWT Bearer token |
| RBAC | User/Admin role checks |

### Webhook Security (Twilio → Backend)
```
1. Validate Twilio signature on every webhook
   - HMAC-SHA1 of request body using Twilio Auth Token
   - Compare with X-Twilio-Signature header
2. Reject unsigned requests with 401
3. IP whitelist: Twilio's published IP ranges
4. Idempotency: deduplicate webhook events by Twilio SID
```

### SIP Security (Mobile → SIP Server)
```
1. SIP over WSS (WebSocket Secure) — mandatory
2. SIP Digest Authentication for registration
3. Strong random SIP passwords per extension
4. TURN server with auth (TURN REST API credentials)
5. ICE: enforce relay candidates only (no direct IP leakage)
```

### Push Notification Security
- VoIP push tokens tied to device + user
- Never expose push tokens in API responses
- APNs/FCM tokens encrypted at rest in DB
- Push payload minimal: only call UUID + caller ID (no sensitive data)

## Compliance Considerations

| Concern | Approach |
|---|---|
| Call Recording | Always play beep; user consent in ToS; stored encrypted |
| Data Privacy | User data in EU/US region as needed; right to deletion |
| Retention | CDR retained 12 months; recordings 6 months; deletable by user |
| Encryption at Rest | PostgreSQL TDE or filesystem encryption; S3 SSE-S3 |
| Encryption in Transit | TLS 1.3 all services |
| Audit Log | Admin actions logged; call metadata immutable |
| CPNI (US) | Call detail records protected; opt-in for marketing |

## Rate Limiting Tiers

| Tier | Requests/min | Calls/min | SMS/day |
|---|---|---|---|
| Basic | 60 | 5 | 50 |
| Pro | 300 | 20 | 500 |
| Enterprise | 1000 | 100 | 5000 |

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing/invalid token |
| TOKEN_EXPIRED | 401 | Access token expired |
| FORBIDDEN | 403 | Insufficient role |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INSUFFICIENT_BALANCE | 402 | No credit for call/SMS |
| EXTENSION_BUSY | 409 | Extension in use |
| PROVIDER_ERROR | 502 | Twilio/upstream failure |
| INTERNAL_ERROR | 500 | Unexpected server error |
