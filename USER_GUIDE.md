# PCPhone — How It Works & User Guide

> Your phone number that follows you everywhere — on mobile, laptop, and PC.

---

## What Is PCPhone?

PCPhone is a **virtual phone system** that gives you a real phone number (e.g. `+1 415 555 0147`) usable from any device with an internet connection. It's like having a SIM card that lives in the cloud — your calls, messages, voicemail, and contacts stay in sync across every device.

Unlike a normal mobile plan:
- One number rings on **all your devices simultaneously**
- Switch devices mid-day without missing a call
- Works over WiFi or cellular data — no SIM required
- All history, voicemail, and contacts stored centrally

 inspired by services like eService Global, RingCentral, and Twilio Flex.

---

## How It Works (Behind the Scenes)

```
   ┌──────────────┐                         ┌──────────────┐
   │ Ordinary     │  ── PSTN call ───────▶ │   Twilio     │
   │ landline/     │                         │  (gateway)  │
   │ mobile        │  ◀── PSTN call ───────│              │
   └──────────────┘                         └──────┬──────┘
                                                   │
                                                   │ VoIP/WebRTC
                                                   │ (internet)
                                                   ▼
                                          ┌──────────────────┐
                                          │  Your Backend    │
                                          │  PCPhone API     │
                                          └────────┬─────────┘
                                                   │
                       ┌───────────────────────────┼───────────────────────┐
                       │                           │                       │
                       ▼                           ▼                       ▼
                ┌────────────┐            ┌────────────────┐      ┌────────────────┐
                │  Mobile     │            │  Laptop         │      │  Desktop PC    │
                │  App        │            │  Web Browser    │      │  Web Browser   │
                │  (Expo)     │            │  (Vite SPA)     │      │  (Vite SPA)    │
                └────────────┘            └────────────────┘      └────────────────┘
```

### The Pieces

| Layer | Role | Where it runs |
|---|---|---|
| **Twilio** | Connects to real phone network (PSTN), handles phone numbers, SMS, calls | Twilio's cloud |
| **PCPhone Backend** | Your account, call routing, voicemail storage, push notifications, billing | Your cloud server (Render/Railway/Fly.io/VPS) |
| **Database (Postgres)** | Users, contacts, call records, voicemail, messages, billing | Backend's cloud |
| **Mobile App** | Softphone dialer, contacts, SMS inbox, voicemail — on iOS/Android | Your phone (Expo Go or installed APK) |
| **Admin Dashboard** | Manage users, assign phone numbers, see call history, system stats | Anywhere with a browser |
| **Push (APNs/FCM)** | Wakes your phone when an inbound call or voicemail arrives | Apple & Google clouds |

### Inbound Call Flow (step-by-step)

1. **Someone dials your number** — `+1 415 555 0147` (a Twilio DID you rented).
2. **Twilio sends a webhook** to your backend at `/webhooks/voice/incoming`.
3. **Backend looks up routing**:
   - Which user owns this number?
   - Are they online? Where should it ring?
   - Did they set "always forward" / "do not disturb"?
4. **Backend writes a CDR row** (call detail record) to PostgreSQL.
5. **Backend sends a push notification** to every device registered to your account (mobile + laptop browser, if they support push).
   - iOS gets a **VoIP push via APNs** → phone wakes and shows the native call screen.
   - Android gets a **high-priority FCM message** → phone wakes and shows the call screen.
6. **Twilio attempts to connect WebRTC** to whichever device answers first.
7. **When you answer**: media flows `PSTN → Twilio → WebRTC → your device`.
8. **When you hang up**: backend updates the CDR with `status=completed`, stores duration/cost.

If you don't answer:
1. After the configured ring count (default 20s), Twilio hits the `dial-status` webhook.
2. Backend checks the dial status → `no-answer` → **voicemail flow**.
3. Backend plays your greeting (`default` voice, custom uploaded audio, or `none`).
4. Twilio records the message, stores audio file, optionally transcribes it.
5. Backend saves the voicemail row + sends a **push notification "new voicemail"**.
6. You see the voicemail in your inbox on every device, with optional transcription.

### Outbound Call Flow

1. **You open the app** → dialer → type a number → tap "Call".
2. App sends `POST /api/v1/calls` with the target number.
3. Backend initiates a Twilio call to **your device first** (WebRTC client).
4. You answer on your device → Twilio then dials the destination PSTN number.
5. Once both legs connect, Twilio bridges the media.
6. CDR stored; billing ledger debited for that minute.

### SMS/MMS Flow

1. Sender texts your Twilio number.
2. Twilio fires `POST /webhooks/sms/incoming`.
3. Backend writes the message + updates the conversation thread.
4. Backend sends a push → your phone shows a notification.
5. You reply from the app → `POST /messages` → backend → Twilio → recipient.

### Conference Call Flow

1. **Host** opens **Conferences** tab → "Create" → sets name + optional PIN.
2. Backend creates a `conferences` row with a random `roomName`.
3. Host shares the Conference Link (URL or queue the call).
4. Each participant dials the conference via:
   - The Twilio number with the conference ID appended
   - Or the SIP/WebRTC client joining the same `roomName`
5. Twilio plays wait music until the first person arrives.
6. Backend's status callbacks fire as each participant `participant-join`s or `participant-leave`s.
7. **Host can end the conference at any time** via `POST /conferences/:id/end` → backend tells Twilio to kick everyone and close the room.

---

## How the End User Uses the App

### 1. First Time Setup

On **each device** you want to use:

**Mobile (iOS/Android)**
1. Install **Expo Go** from App Store / Play Store (or install the APK once it's built).
2. Open Expo Go, scan the project QR code displayed by `npx expo start`.
3. App launches → **Create Account** screen.
4. Enter email, password, name → tap **Create Account**.
5. You're logged in. The app remembers you next time.

**Laptop/Desktop**
1. Open the **PCPhone Web URL** in any browser (Chrome, Edge, Firefox, Safari).
2. Log in with the same email + password you used on mobile.
3. You see the **same dashboard** — calls, messages, contacts.

### 2. Getting a Phone Number

After login, you don't yet have a phone number. To get one:

**If you're a regular user**
1. Go to **Settings → My Number**.
2. Tap **"Get a Number"**.
3. Choose a country + area code (mobile, or admin assigns one).
4. Confirm — your number is now assigned (`+1 415 555 0147`).
5. Anyone can now reach you by dialling that number.

**If you're an admin**
1. Open the **Admin Dashboard** at `https://admin.your-domain.com`.
2. Log in with an admin-role account.
3. Go to **Phone Numbers** → see pool of Twilio-purchased numbers.
4. Click **Assign** next to a number → choose a user.

### 3. Making a Call

**From the mobile app**
1. Open the **Calls** tab (leftmost tab).
2. Tap the blue **"Dial"** FAB at bottom-right.
3. Dial pad opens — type the number.
4. As you type, formatting `(415) 555-0147` appears automatically.
5. Tap the green **Call** button.
6. The **Active Call** screen appears with mute, keypad, speaker, hold, add-call, and record buttons.
7. Tap **End** (red) to hang up.

**From the laptop/PC web app**
1. Open the web app in your browser.
2. Click the **Calls** tab.
3. Click the dialer icon.
4. Type the number → Click **Call**.
5. The browser asks for microphone access (one-time) → click **Allow**.
6. The call connects using your laptop's mic + speakers.

**Tips**
- Switch between phone and laptop mid-call by tapping **Hold** on one and **Resume** on the other.
- Tap **Keypad** during a call to enter IVR/menu selections (e.g., "press 1 for sales").

### 4. Receiving a Call

When someone calls your PCPhone number:

**Mobile**
- Your phone rings like a normal call — the **native iOS/Android call screen** appears (powered by CallKit/ConnectionService).
- Caller ID shows if they're in your contacts.
- Tap **Accept** (green) to talk, **Decline** (red) to send them to voicemail.
- Even if the app is closed or phone is asleep, the VoIP push wakes it up.

**Laptop/Desktop**
- A browser notification appears with **Accept / Decline** buttons.
- Click **Accept** to answer via your laptop's mic.
- Works even if the browser tab is in the background (as long as notifications are enabled).

**Simulring**: all your devices ring at once. Answer from whichever is closest.

### 5. Sending a Text Message (SMS)

**Mobile**
1. Tap the **Messages** tab.
2. Tap the **New** FAB at bottom-right.
3. Enter the recipient's number (or pick a contact).
4. Type the message → tap **Send**.
5. The conversation appears in your Messages list with delivery status.

**Web app**
1. Click **Messages** tab.
2. Click **New**.
3. Same as mobile — type and send.

**Receiving a text**: A push notification appears on mobile (and browser notification on laptop). Reply right from the notification (mobile) or click to open the thread (web).

### 6. Listening to Voicemail

**Mobile**
1. Open the app → **Settings → Voicemail** (or dedicated Voicemail tab if enabled).
2. See list of voicemails with **caller, time, duration** and a "read/unread" dot.
3. Tap a voicemail to:
   - Listen to the audio (plays on speaker or earpiece, your choice).
   - Read the **transcription** if enabled (text auto-generated).
   - Tap **Mark as Read** / **Delete**.

**Web**
- Same flow — audio plays through your browser.

**Tip**: Tap **Call back** from a voicemail to immediately dial the person who left it.

### 7. Managing Contacts

**Mobile**
1. **Contacts** tab → tap **+ Add**.
2. Enter name, phone, email.
3. Tap the star ⭐ to mark as favorite — favorites appear at the top.
4. Tap a contact to call, message, or edit it.

**Web**
- Same, plus you can import from a CSV (planned feature).

Contacts sync automatically between all your devices — add on mobile, see on laptop instantly.

### 8. Conferences (Group Calls)

**To start a conference**
1. **Conferences** tab → tap **+**.
2. Enter a name ("Weekly Standup") and optional PIN.
3. Tap **Create** — you get a Conference Room.
4. The room shows status **Active**.
5. Share the dial-in info with participants:
   - "Call +1 415 555 0147, when asked, enter the conference ID `conf-abc12345#`"
   - OR participants use the app and tap "Join" on a shared conference link (planned)

**To join a conference**
1. Dial the main PCPhone number.
2. Enter the conference ID when prompted.
3. Enter the PIN if required.
4. You're in — hear hold music until others arrive.

**To end a conference**
1. As the host, open **Conferences** tab.
2. Tap **End** next to your active conference.
3. All participants are disconnected, the room closes.

### 9. Configuring Settings

**Settings** tab (mobile & web) lets you:

| Setting | What it does |
|---|---|
| **Call Forwarding** | Always forward to another number; forward on busy; forward on no-answer with adjustable ring count |
| **Voicemail** | Greeting type (default / custom upload / none); PIN to retrieve voicemail from any phone; enable transcription; email notifications |
| **Do Not Disturb** | Silence inbound calls (they go straight to voicemail) |
| **Call Recording** | Auto-record your calls (with consent tone) |
| **Notifications** | Push for missed calls, voicemails, SMS — toggle per type |
| **Sound & Ringtone** | Pick your ringtone (planned) |
| **Network (SIP Settings)** | Manually configure SIP server (advanced) |
| **Sign Out** | Sign out of this device |

### 10. Using the Same Account on Multiple Devices

This is PCPhone's superpower. To add a new device:

1. Install the app (or visit the web URL) on the new device.
2. Log in with the **same email + password**.
3. That's it — the new device:
   - Rings simultaneously with your other devices on inbound calls
   - Sees the same call history
   - Sees the same voicemail
   - Sees the same contacts
   - Sees the same SMS conversations

When a call comes in, you can:
- Answer on phone, tap **Hold**, then **Resume** on the laptop → conversation continues seamlessly.
- Decline on one device and accept on another.

---

## Daily Usage Patterns

### Typical Day with PCPhone

| Time | Device | What you do |
|---|---|---|
| 8:00am | Phone | Wake up — see overnight voicemails (transcribed) |
| 9:00am | Phone | Commute — answer a client call while on the train |
| 10:00am | Laptop | Arrive at office — call switches to laptop via Hold/Resume |
| 11:00am | Laptop | Conference call with team — start one in Conferences tab |
| 1:00pm | Phone | Lunch — text a contact from Messages |
| 3:00pm | Desktop PC | Return 4 missed calls from call history with one click |
| 6:00pm | Phone | Drive home — inbound call rings via CarPlay Bluetooth |
| 9:00pm | Tablet | Check messages from the couch |

Everything stays in sync — no "where's that text I sent" moments.

---

## Common Scenarios

### "I lost my phone"
- Your number isn't tied to the SIM. Log in from any other device — number still works.
- Revoke the lost device's session from Settings → Devices (planned feature).

### "I'm travelling abroad"
- No international roaming fees. PCPhone works on any WiFi or local data SIM.
- Downside: caller still sees your US/UK/etc. number — they pay normal rates to reach you.

### "I want a separate work and personal number"
- Buy 2 numbers — switch in Settings between accounts (or have admin assign both).
- Use per-number voicemail greetings and forwarding rules.

### "My internet is spotty"
- WebRTC adapts to lower bandwidth automatically (codec switches from Opus → narrowband).
- Missed call + voicemail captured regardless — backend records even if you can't answer.

### "I want calls to ring my office landline too"
- Call Forwarding → **Simultaneous Ring** — add your office number.
- All phones ring at once; first to pick up gets the call.

---

## Admin Use (For Team / Enterprise)

If you're an admin user (role: `admin`), you also have access to the **Admin Dashboard** web app.

Open `https://admin.your-domain.com` → log in with admin credentials.

### Things admins can do
- See total users, active users, DIDs assigned/available
- Search users, disable accounts, change plans (basic → pro → enterprise)
- View all DIDs (phone numbers) — who's assigned to what
- Assign / unassign a number to a user with one click
- See **all recent calls** across the whole system (compliance + debugging)
- See revenue (sum of paid billing records)
- Configure Twilio webhook URLs on the Twilio console URL given in deployment guide

### Things regular users cannot do
- See other users' data
- Assign DIDs
- View system-wide stats
- Change another user's plan

Role-based access control (RBAC) is enforced at the API level — every admin endpoint checks `role === "admin"`.

---

## Troubleshooting for End Users

| Symptom | What to check |
|---|---|
| **App won't log in** | Confirm email spelling; reset password via "Forgot Password?" |
| **No inbound calls ringing** | Check Settings → Notifications (push enabled?); allow notifications in OS settings |
| **Calls sound robotic/choppy** | Switch to a better WiFi; turn off "Do Not Disturb" |
| **Voicemail not received** | Check Settings → Voicemail (greeting type not "none"); check call was no-answer (not declined) |
| **SMS not sending** | Verify the number supports SMS (some Twilio trial numbers are voice-only); check billing |
| **Can't answer on laptop** | Allow microphone permission in browser; use Chrome/Edge (best WebRTC support) |
| **Conference PIN rejected** | Re-enter the PIN the host set; ask host to confirm or remove PIN |
| **Mobile push not arriving (iOS)** | Settings → Notifications → PCPhone → enable "Allow Notifications" + "Time Sensitive" |
| **Mobile push not arriving (Android)** | Settings → Apps → PCPhone → Battery → Unrestricted; ensure background data allowed |

---

## Privacy & Security (Plain English)

- **Authentication**: Email + password. Passwords are bcrypt-hashed, never stored in clear text.
- **Sessions**: JWT access tokens expire in 1 hour; refresh tokens rotate on each use and expire in 30 days.
- **Call recordings**: Stored encrypted at rest. Only you can access them via your authenticated session. A consent tone plays before recording starts.
- **Voicemail audio**: Stored in encrypted object storage (S3). Only you can stream it.
- **SMS content**: Stored in your database, accessible only via your authenticated session.
- **Push tokens**: Tied to your user ID, encrypted at rest, never shared with anyone.
- **Log out**: Clears local tokens; backend invalidates the refresh token so the device cannot log back in without your password.
- **GDPR / data deletion**: You can request account deletion; we erase your user record, contacts, voicemail, messages per data-retention policy.

---

## Quick Reference — Where Things Live

| You want to... | Go to... |
|---|---|
| Make a call | Calls tab → Dial FAB |
| See call history | Calls tab → list (top of screen) |
| Send a text | Messages tab → New FAB |
| Listen to voicemail | Settings → Voicemail (or Voicemail tab) |
| Add a contact | Contacts tab → + Add |
| Start a group call | Conferences tab → + |
| Enable Do Not Disturb | Settings → Do Not Disturb |
| Set call forwarding | Settings → Call Forwarding |
| Change voicemail greeting | Settings → Voicemail → Greeting |
| Sign out | Settings → Sign Out |
| See all calls (admin) | Admin Dashboard → Calls |
| Assign phone numbers (admin) | Admin Dashboard → Phone Numbers |
| Manage users (admin) | Admin Dashboard → Users |

---

## Need Help?

- **Documentation**: All design docs are in the `docs/` folder of the repo
- **Deployment**: `docs/07-deployment.md` + `SETUP.md` cover all deployment options
- **Issues**: Open an issue at https://github.com/ibrahimrasras-collab/pcphone/issues
- **Tech stack**: See `docs/02-tech-stack.md`

PCPhone is open source — feel free to contribute, self-host, or fork.
