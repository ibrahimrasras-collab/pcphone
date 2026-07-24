# API Design — Virtual Phone

## Base URL
- Development: `http://localhost:4000/api/v1`
- Production: `https://api.phone.example.com/api/v1`

## Authentication
All endpoints (except `/auth/*`) require `Authorization: Bearer <token>` header.

## Standard Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

## Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": [{ "field": "to", "message": "Must be E.164 format" }]
  }
}
```

## Endpoints

### Authentication

```
POST   /auth/register          # Create account
POST   /auth/login             # Login, returns JWT + refresh
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Invalidate refresh token
POST   /auth/forgot-password   # Send reset email
POST   /auth/reset-password    # Reset with token
```

### Users & Extensions

```
GET    /users/me               # Get current user profile
PUT    /users/me               # Update profile
PUT    /users/me/password      # Change password

GET    /users/me/extension     # Get assigned extension details
PUT    /users/me/extension     # Update extension settings (caller ID, etc.)
```

### Contacts

```
GET    /contacts               # List contacts (paginated)
POST   /contacts               # Create contact
GET    /contacts/:id           # Get contact
PUT    /contacts/:id           # Update contact
DELETE /contacts/:id           # Delete contact
```

### Calls

```
POST   /calls                  # Initiate outbound call
GET    /calls                  # List call history (CDR)
GET    /calls/:id              # Get call details
POST   /calls/:id/transfer     # Transfer call
POST   /calls/:id/hold         # Hold call
POST   /calls/:id/resume       # Resume held call
```

### Voicemail

```
GET    /voicemail              # List voicemail messages
GET    /voicemail/:id          # Get voicemail details
GET    /voicemail/:id/audio    # Stream audio file
PUT    /voicemail/:id/transcript # Request transcription
DELETE /voicemail/:id          # Delete voicemail
PUT    /voicemail/:id/read     # Mark as read/unread
```

### Messages (SMS/MMS)

```
GET    /messages               # List conversations
POST   /messages               # Send SMS
GET    /messages/:id           # Get message thread
DELETE /messages/:id           # Delete message
```

### Recordings

```
GET    /recordings             # List call recordings
GET    /recordings/:id         # Get recording details
GET    /recordings/:id/stream  # Download/stream audio
DELETE /recordings/:id         # Delete recording
```

### Routing & Settings

```
GET    /settings               # Get all user settings
PUT    /settings               # Update settings
PUT    /settings/forwarding    # Update call forwarding rules
PUT    /settings/voicemail     # Update voicemail greeting
PUT    /settings/dnd           # Toggle Do Not Disturb
```

### Billing

```
GET    /billing/usage          # Get usage summary
GET    /billing/invoices       # List invoices
GET    /billing/payment-methods # List saved payment methods
POST   /billing/payment-methods # Add payment method
```

### Admin (role: admin)

```
GET    /admin/users            # List all users
GET    /admin/users/:id        # Get user details
PUT    /admin/users/:id        # Update user (suspend, plan change)
GET    /admin/dids             # List available phone numbers
POST   /admin/dids/assign      # Assign DID to user
GET    /admin/system/status    # System health
```

## Webhooks (from Twilio)

These are called by Twilio — **not** by the mobile app.

```
POST   /webhooks/voice/incoming    # Inbound call
POST   /webhooks/voice/status      # Call status callback
POST   /webhooks/voice/recording   # Recording available
POST   /webhooks/sms/incoming      # Inbound SMS
POST   /webhooks/sms/status        # SMS delivery status
```

## Request/Response Examples

### POST /auth/register
```json
// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "name": "John Doe"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "extension": "1001",
      "created_at": "2026-07-25T00:00:00Z"
    },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "expires_in": 3600
    }
  }
}
```

### POST /calls (Initiate Outbound)
```json
// Request
{
  "to": "+12223334444",
  "from": "+19998887777",
  "caller_id": "John Doe"
}

// Response
{
  "success": true,
  "data": {
    "call_id": "uuid",
    "status": "initiating",
    "twilio_sid": "CA123...",
    "created_at": "2026-07-25T00:00:00Z"
  }
}
```

### GET /calls (Call History)
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "direction": "inbound",
      "from": "+12223334444",
      "to": "+19998887777",
      "status": "completed",
      "duration_seconds": 120,
      "cost": 0.015,
      "recorded": true,
      "started_at": "2026-07-25T00:00:00Z",
      "ended_at": "2026-07-25T00:02:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45
  }
}
```

## Pagination
All list endpoints support:
- `?page=1&per_page=20` (default: per_page=20, max: 100)
- `?cursor=<cursor_id>` (cursor-based for real-time feeds)

## Rate Limiting
| Scope | Limit | Window |
|---|---|---|
| Global (per IP) | 100 req/s | 1 second |
| Auth endpoints | 10 req/min | 1 minute |
| Call initiation | 5 req/s | 1 second |
| SMS sending | 10 req/min | 1 minute |

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
