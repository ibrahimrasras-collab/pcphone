# Data Models — Virtual Phone

## Entity Relationship Overview

```
users ──── extensions ──── dids
  │            │
  │            ├── call_forwarding
  │            ├── voicemail_settings
  │            └── voicemail_messages
  │
  ├── contacts
  ├── call_records (CDR)
  ├── messages / conversations
  ├── recordings
  ├── billing_records
  └── refresh_tokens
```

## PostgreSQL Schema

### users
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
  plan            VARCHAR(20) NOT NULL DEFAULT 'basic'
                    CHECK (plan IN ('basic', 'pro', 'enterprise')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
```

### extensions
```sql
CREATE TABLE extensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  extension       VARCHAR(10) UNIQUE NOT NULL,
  caller_id_name  VARCHAR(255) NOT NULL DEFAULT '',
  caller_id_num   VARCHAR(20) NOT NULL DEFAULT '',
  is_registered   BOOLEAN NOT NULL DEFAULT false,
  sip_password    VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extensions_user ON extensions(user_id);
CREATE INDEX idx_extensions_ext ON extensions(extension);
```

### dids (phone numbers)
```sql
CREATE TABLE dids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number    VARCHAR(20) UNIQUE NOT NULL,
  assigned_to     UUID REFERENCES users(id),
  twilio_sid      VARCHAR(255) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dids_assigned ON dids(assigned_to);
CREATE INDEX idx_dids_number ON dids(phone_number);
```

### call_forwarding
```sql
CREATE TABLE call_forwarding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  always_to       VARCHAR(20),
  busy_to         VARCHAR(20),
  no_answer_to    VARCHAR(20),
  no_answer_rings INTEGER NOT NULL DEFAULT 15,
  unavailable_to  VARCHAR(20),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### call_records (CDR)
```sql
CREATE TABLE call_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  twilio_sid      VARCHAR(255),
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number     VARCHAR(20) NOT NULL,
  to_number       VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL
                    CHECK (status IN ('initiated','ringing','in-progress',
                                      'completed','busy','failed','no-answer','canceled')),
  duration_seconds INTEGER DEFAULT 0,
  cost            DECIMAL(10,6) DEFAULT 0,
  recorded        BOOLEAN NOT NULL DEFAULT false,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  hangup_cause    VARCHAR(50)
);
CREATE INDEX idx_cdr_user ON call_records(user_id);
CREATE INDEX idx_cdr_started ON call_records(started_at DESC);
CREATE INDEX idx_cdr_twilio ON call_records(twilio_sid);
```

### voicemail_settings
```sql
CREATE TABLE voicemail_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  greeting_type   VARCHAR(10) NOT NULL DEFAULT 'default'
                    CHECK (greeting_type IN ('default', 'custom', 'none')),
  greeting_url    TEXT,
  transcription   BOOLEAN NOT NULL DEFAULT true,
  email_notify    BOOLEAN NOT NULL DEFAULT false,
  email_address   VARCHAR(255),
  pin             VARCHAR(6),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### voicemail_messages
```sql
CREATE TABLE voicemail_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caller_number   VARCHAR(20) NOT NULL,
  caller_name     VARCHAR(255),
  duration_seconds INTEGER NOT NULL,
  audio_url       TEXT NOT NULL,
  transcription   TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vm_user ON voicemail_messages(user_id);
CREATE INDEX idx_vm_read ON voicemail_messages(user_id, is_read);
```

### contacts
```sql
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  phone_number    VARCHAR(20) NOT NULL,
  email           VARCHAR(255),
  avatar_url      TEXT,
  favorite        BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);
CREATE INDEX idx_contacts_user ON contacts(user_id);
```

### conversations
```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_number  VARCHAR(20) NOT NULL,
  contact_name    VARCHAR(255),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_conv_user ON conversations(user_id);
```

### messages
```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body            TEXT NOT NULL,
  media_urls      JSONB DEFAULT '[]',
  status          VARCHAR(20) NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('queued','sent','delivered','failed','read')),
  twilio_sid      VARCHAR(255),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_msg_conv ON messages(conversation_id);
```

### recordings
```sql
CREATE TABLE recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id  UUID NOT NULL REFERENCES call_records(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  audio_url       TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes  INTEGER,
  format          VARCHAR(10) NOT NULL DEFAULT 'wav',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### billing_records
```sql
CREATE TABLE billing_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(20) NOT NULL CHECK (type IN ('subscription','usage','sms')),
  description     TEXT NOT NULL,
  amount          DECIMAL(10,4) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  invoice_id      VARCHAR(100),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','failed','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_billing_user ON billing_records(user_id);
```

### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,
  device_info     VARCHAR(255),
  ip_address      VARCHAR(45),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_hash ON refresh_tokens(token_hash);
```

## JSON Types

### user_settings (stored in Redis, not DB)
```json
{
  "theme": "light",
  "language": "en",
  "dial_timeout": 30,
  "record_calls": false,
  "show_caller_id": true,
  "notifications": {
    "missed_call": true,
    "voicemail": true,
    "sms": true,
    "push_enabled": true
  }
}
```

### call_forwarding rules (in DB column)
```json
{
  "always": null,
  "busy": "+12223334444",
  "no_answer": {
    "target": "voicemail",
    "ring_timeout": 25
  },
  "unavailable": "+18883334444",
  "simultaneous_ring": ["+12223334444", "sip:user@domain.com"]
}
```
