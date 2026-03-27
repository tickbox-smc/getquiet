# Quiet — Phase 2 Technical Architecture
## Live inbox integration via Microsoft Graph API

*Version 2.0 — March 2026*

---

## Overview

Phase 2 wires the Quiet decision interface to a real mailbox. The mocked data layer is replaced by a live pipeline: Microsoft Graph API polling → Claude scoring engine → SQLite store → FastAPI → existing web UI.

Quiet ships as a single product with two modes set at account creation:

```
              Quiet Engine
              (same core)
             /            \
        Quiet          Quiet Protect
   "Your inbox,       "Peace of mind
  without the          for your family"
     inbox."
```

**Quiet** is a productivity tool for people who want to stop thinking about email.

**Quiet Protect** is a safety layer for elderly or vulnerable users, managed by a trusted family member. The adult child sets up the account, configures trusted senders, and receives a weekly digest. The protected user sees only safe, delivered emails — everything else is silently blocked before they ever see it.

One codebase. One deployment. One schema. Mode is a single field on the account that changes the scoring prompt, the routing logic, and the UI skin.

---

## System diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          QUIET PHASE 2                               │
│                                                                      │
│  ┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐  │
│  │  Mail poller │───>│  Scoring engine   │───>│  Decision store  │  │
│  │  (scheduler) │    │  (Claude)         │    │    (SQLite)      │  │
│  └──────────────┘    │                   │    └────────┬─────────┘  │
│         │            │  mode=quiet  →    │             │            │
│         │            │  importance +     │             │            │
│         │            │  actionability    │    ┌────────▼─────────┐  │
│  ┌──────▼──────┐     │                   │    │    FastAPI       │  │
│  │ Graph API   │     │  mode=protect →   │    │  (local server)  │  │
│  │ (Microsoft) │     │  scam detection + │    └────────┬─────────┘  │
│  └─────────────┘     │  threat scoring   │             │            │
│                      └───────────────────┘    ┌────────▼─────────┐  │
│                                               │   Web UI         │  │
│                                               │  Quiet /         │  │
│                                               │  Quiet Protect   │  │
│                                               └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Mode comparison

| Dimension | Quiet | Quiet Protect |
|---|---|---|
| Primary user | Themselves | Elderly / vulnerable parent |
| Buyer | Themselves | Adult child / family manager |
| Core value | Save time | Prevent harm |
| Scoring priority | Importance + actionability | Scam detection + sender trust |
| Protected user UI | Decision interface | Clean safe inbox only |
| Family manager UI | Not applicable | Family dashboard |
| Notifications | None | Weekly digest + immediate scam alerts |
| Setup | Self-serve | Family member configures |

---

## Component 1 — Mail poller

**Purpose:** Fetch new messages from Microsoft Graph API on a schedule and push them to the scoring engine.

**Technology:** Python + APScheduler + MSAL

**Polling interval:** Every 5 minutes. Identical for both modes.

### How it works

1. MSAL authenticates using a cached OAuth token, refreshing automatically when expired.
2. A GET request fetches messages received since the last poll timestamp.
3. Each message is normalised into a standard RawEmail object.
4. The account mode is attached to each message before queuing.
5. Messages are passed to the scoring engine queue.
6. The last-polled timestamp is updated in the store.

### Key Graph API calls

```
# Fetch new messages since last poll
GET /me/mailFolders/inbox/messages
    ?$filter=receivedDateTime ge {last_poll}
    &$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments,isRead
    &$orderby=receivedDateTime desc
    &$top=50

# Move to archive
POST /me/messages/{id}/move
Body: { "destinationId": "archive" }

# Send reply
POST /me/messages/{id}/reply
Body: { "message": { "body": { "content": "..." } } }
```

### RawEmail object

```python
@dataclass
class RawEmail:
    message_id: str          # Graph API message ID
    account_id: str          # Links to accounts table
    mode: str                # 'quiet' | 'protect'
    subject: str
    sender_email: str
    sender_name: str
    received_at: datetime
    body_preview: str        # First 255 chars
    has_attachments: bool
    is_read: bool
    thread_id: str
```

### OAuth setup (Azure portal — one-time)

1. Register an app at portal.azure.com → Azure Active Directory → App registrations
2. Set redirect URI to http://localhost:8400/callback
3. Add delegated permissions: Mail.Read, Mail.ReadWrite, Mail.Send, offline_access
4. Copy client_id and tenant_id to .env
5. Run auth flow once — token cached to disk by MSAL

---

## Component 2 — Scoring engine

**Purpose:** Classify each email with scores and a routing decision. Prompt and routing logic vary by mode.

**Technology:** Python + Anthropic SDK (Claude Sonnet)

**Cost estimate:** ~£0.002 per email scored at current API pricing

### Mode dispatch

```python
def score_email(email: RawEmail, sender_history: SenderHistory) -> ScoredEmail:
    if email.mode == 'protect':
        return score_protect(email, sender_history)
    else:
        return score_quiet(email, sender_history)
```

---

### Quiet mode scoring

#### ScoredEmail object

```python
@dataclass
class ScoredEmail:
    message_id: str
    importance_score: int       # 1-5
    importance_reason: str
    actionability: str          # reply_needed | review_required |
                                # fyi | promotional | notification
    deadline_detected: bool
    routing: str                # act | handle | suppress
    suggested_action: str       # reply | archive | mute |
                                # unsubscribe_candidate | auto_unsubscribe
    agent_note: str             # plain English, max 30 words
    scored_at: datetime
    # Protect-mode fields (null in Quiet mode)
    threat_score: int
    threat_reason: str
    threat_signals: list[str]
```

#### Importance score reference

| Score | Meaning | Example senders |
|-------|---------|-----------------|
| 5 | Critical | Boss, legal, HMRC, bank |
| 4 | High | Colleagues, clients, direct reports |
| 3 | Medium | Known contacts, relevant services |
| 2 | Low | Newsletters you open occasionally |
| 1 | Minimal | Marketing, promotions, notifications |

#### Batch processing

- Up to 5 low-importance emails scored in a single prompt to minimise cost
- High-importance emails (score 4-5 from sender history) scored individually
- Promotional senders with 10+ prior ignores skip Claude entirely — routed directly to suppress

---

### Quiet Protect mode scoring

When mode = 'protect', the engine loads a different system prompt. Claude weights threat signals heavily. Trusted senders bypass threat scoring entirely.

#### Threat signals Claude evaluates

**Urgency and pressure language**
- "Act now", "Your account will be closed", "Immediate action required"
- Artificial deadlines, countdown language, consequence threats

**Impersonation patterns — common UK targets**
- HMRC — unexpected tax refunds, unpaid tax threats
- Royal Mail / Parcelforce — failed delivery, customs fee requests
- Banks — account suspended, unusual activity, verify details
- BT / Sky / Virgin — account cancellation, payment failed
- TV Licensing — licence expired, enforcement action
- NHS — appointment links, prescription requests

**Sender domain anomalies**
- Domains that mimic legitimate organisations (hmrc-refund.co.uk, royal-mai1.com)
- Mismatched display name vs actual sending domain
- Free email providers sending as institutional senders

**Content patterns**
- Requests for passwords, PINs, bank details, National Insurance numbers
- Links to login pages (phishing)
- Unexpected prize, lottery, or inheritance notifications
- Requests to call a premium rate number

#### Routing in Protect mode

| Threat score | Routing | Action |
|---|---|---|
| 0 | Normal Quiet routing | Act / handle / suppress as standard |
| 1-2 | Suppress | Added to family manager review queue |
| 3-5 | Block | Never delivered — family manager alerted immediately |

Threat detection is additive — it overrides routing toward suppression, never away from it.

---

## Component 3 — Decision store

**Purpose:** Persist all emails, scores, sender behaviour, user actions, and agent actions. Single source of truth for both UIs.

**Technology:** SQLite (local) — upgradeable to Postgres for hosted deployment

### Schema

```sql
-- Account registry — one row per user
CREATE TABLE accounts (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE,
    mode            TEXT DEFAULT 'quiet',         -- 'quiet' | 'protect'
    display_name    TEXT,
    protected_by    TEXT REFERENCES accounts(id), -- family manager account ID
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw emails from Graph API
CREATE TABLE emails (
    id              TEXT PRIMARY KEY,
    account_id      TEXT REFERENCES accounts(id),
    subject         TEXT,
    sender_email    TEXT,
    sender_name     TEXT,
    received_at     TIMESTAMP,
    body_preview    TEXT,
    has_attachments BOOLEAN,
    thread_id       TEXT,
    raw_json        TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scoring results (threat fields null in Quiet mode)
CREATE TABLE scores (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id          TEXT REFERENCES emails(id),
    importance_score    INTEGER,
    importance_reason   TEXT,
    actionability       TEXT,
    deadline_detected   BOOLEAN,
    routing             TEXT,
    suggested_action    TEXT,
    agent_note          TEXT,
    threat_score        INTEGER,    -- null in Quiet mode
    threat_reason       TEXT,       -- null in Quiet mode
    threat_signals      TEXT,       -- JSON array, null in Quiet mode
    scored_at           TIMESTAMP
);

-- Sender behavioural model
CREATE TABLE senders (
    account_id          TEXT REFERENCES accounts(id),
    email               TEXT,
    name                TEXT,
    total_received      INTEGER DEFAULT 0,
    total_opened        INTEGER DEFAULT 0,
    total_replied       INTEGER DEFAULT 0,
    total_ignored       INTEGER DEFAULT 0,
    ignore_streak       INTEGER DEFAULT 0,
    is_muted            BOOLEAN DEFAULT FALSE,
    is_protected        BOOLEAN DEFAULT FALSE,
    unsubscribe_status  TEXT DEFAULT 'none',
    last_interaction    TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, email)
);

-- Trusted senders (Protect mode — always delivered, bypass threat scoring)
CREATE TABLE trusted_senders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      TEXT REFERENCES accounts(id),
    email           TEXT,
    name            TEXT,
    added_by        TEXT REFERENCES accounts(id),  -- family manager
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User actions
CREATE TABLE actions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id      TEXT REFERENCES emails(id),
    action_type     TEXT,   -- opened | replied | archived | deleted |
                            -- ignored | muted | unsubscribed
    acted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent action log
CREATE TABLE agent_actions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id      TEXT REFERENCES emails(id),
    action_type     TEXT,   -- auto_archived | auto_replied |
                            -- auto_unsubscribed | muted | blocked_scam
    action_detail   TEXT,
    acted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System state
CREATE TABLE state (
    key     TEXT PRIMARY KEY,
    value   TEXT
);
```

### Ignore threshold logic — Quiet mode

```python
def update_ignore_streak(account_id: str, sender_email: str, was_ignored: bool):
    if was_ignored:
        streak = increment_streak(account_id, sender_email)
        if streak >= 20 and has_list_unsubscribe(sender_email):
            mark_for_auto_unsubscribe(account_id, sender_email)
        elif streak >= 10:
            mark_as_unsubscribe_candidate(account_id, sender_email)
        elif streak >= 5:
            mute_sender(account_id, sender_email)
    else:
        reset_streak(account_id, sender_email)
```

---

## Component 4 — FastAPI server

**Purpose:** Serve decision data to both UIs. Mode-specific routes prefixed /api/protect/.

**Technology:** Python + FastAPI + Uvicorn. Runs on localhost:8000.

### Quiet mode endpoints

```
GET  /api/summary
GET  /api/act
GET  /api/handled
GET  /api/suppressed
POST /api/action           { message_id, action_type }
GET  /api/senders
PUT  /api/senders/{email}/protect
PUT  /api/senders/{email}/mute
GET  /api/settings
PUT  /api/settings
```

### Quiet Protect endpoints (family manager)

```
GET    /api/protect/summary
       Returns: { delivered_count, suppressed_count, blocked_count, scam_alerts_week }

GET    /api/protect/blocked
       Returns: Blocked emails with threat_score, threat_reason, threat_signals

GET    /api/protect/digest
       Returns: Weekly digest content

GET    /api/protect/trusted
POST   /api/protect/trusted          { email, name }
DELETE /api/protect/trusted/{email}

PUT    /api/protect/settings
       Updates digest frequency, alert threshold
```

---

## Component 5 — Web UI

Two UI skins, one data source. Both fetch from the same FastAPI server. Mode is read from the account on load.

**Quiet UI** — The Phase 1 decision interface. Act / Handled / Suppressed panels. Mocked data replaced with live fetch() calls.

**Quiet Protect — protected user view** — Clean simplified inbox. Only emails with routing = 'act' and threat_score = 0 shown. No suppression controls. Designed to feel like a normal email inbox — just a very quiet one.

**Quiet Protect — family manager view** — Weekly stats, blocked email list with threat reasons, trusted sender management, digest preview. Designed for weekly review and initial setup, not daily monitoring.

### Live data fetch pattern

```javascript
const mode = await fetch('/api/account/mode').then(r => r.json());

if (mode === 'protect-manager') {
    const [summary, blocked, trusted] = await Promise.all([
        fetch('/api/protect/summary').then(r => r.json()),
        fetch('/api/protect/blocked').then(r => r.json()),
        fetch('/api/protect/trusted').then(r => r.json()),
    ]);
} else {
    const [summary, act, handled, suppressed] = await Promise.all([
        fetch('/api/summary').then(r => r.json()),
        fetch('/api/act').then(r => r.json()),
        fetch('/api/handled').then(r => r.json()),
        fetch('/api/suppressed').then(r => r.json()),
    ]);
}

setInterval(refreshData, 5 * 60 * 1000);
```

---

## Notification model — Protect mode

### Weekly digest (to family manager)

Sent every Sunday morning. Tone is reassuring by default.

> "Your father's inbox was safe this week. 3 emails needed his attention. 61 were quietly handled. 4 potential scams were blocked before he saw them."

Contains: total received, delivered, suppressed, blocked (with threat type summary), new unsubscribe candidates.

### Immediate scam alert (to family manager)

Triggered when threat_score >= 4. Sent within minutes of detection. Contains sender details, subject, threat reason in plain English, threat signals, and confirmation the email was blocked.

The protected user never sees this. They are never aware a scam attempt was made.

---

## Project structure

```
quiet/
├── .env
├── requirements.txt
├── main.py
│
├── auth/
│   └── graph_auth.py
│
├── poller/
│   ├── scheduler.py
│   └── graph_client.py
│
├── scoring/
│   ├── engine.py               # Mode dispatch
│   ├── quiet_scorer.py         # Importance + actionability
│   ├── protect_scorer.py       # Scam detection + threat scoring
│   ├── prompts.py              # Claude prompt templates (both modes)
│   └── batch.py
│
├── store/
│   ├── database.py
│   ├── accounts.py
│   ├── emails.py
│   ├── senders.py
│   ├── trusted.py              # Trusted sender whitelist (Protect mode)
│   └── actions.py
│
├── api/
│   ├── server.py
│   └── routes/
│       ├── quiet/
│       │   ├── summary.py
│       │   ├── act.py
│       │   ├── handled.py
│       │   ├── suppressed.py
│       │   └── settings.py
│       └── protect/
│           ├── summary.py
│           ├── blocked.py
│           ├── digest.py
│           ├── trusted.py
│           └── settings.py
│
└── ui/
    ├── quiet.html
    └── protect/
        ├── protected_user.html
        └── family_manager.html
```

---

## Dependencies

```
# requirements.txt
anthropic>=0.25.0
msal>=1.28.0
fastapi>=0.110.0
uvicorn>=0.29.0
apscheduler>=3.10.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

---

## Environment variables

```bash
# .env
CLIENT_ID=<azure-app-client-id>
TENANT_ID=<azure-tenant-id>
ANTHROPIC_API_KEY=<your-anthropic-key>
DB_PATH=./quiet.db
POLL_INTERVAL_MINUTES=5
# Quiet mode thresholds
IGNORE_MUTE_THRESHOLD=5
IGNORE_SUGGEST_THRESHOLD=10
IGNORE_AUTO_UNSUB_THRESHOLD=20
# Protect mode thresholds
PROTECT_ALERT_THRESHOLD=4
PROTECT_BLOCK_THRESHOLD=3
PROTECT_DIGEST_DAY=sunday
```

---

## Startup sequence

```
python main.py
  ├── Initialise SQLite schema (if first run)
  ├── Check for cached MSAL token
  │   └── If none → open browser for OAuth consent flow
  ├── Start APScheduler (poll every 5 min)
  ├── Run initial poll immediately
  └── Start FastAPI on localhost:8000

Open ui/ in browser
  ├── Account mode fetched on load
  ├── Quiet mode → quiet.html
  └── Protect mode → protect/protected_user.html
                     or protect/family_manager.html
```

---

## Phase 2 to Phase 3 upgrade path

| Capability | Phase 2 | Phase 3 |
|---|---|---|
| Read emails | Yes | Yes |
| Score and route | Yes | Yes |
| Scam detection (Protect) | Yes | Yes |
| Auto-archive | No | Yes |
| Auto-reply | No | Yes |
| Auto-unsubscribe | No | Yes |
| Auto-block scams (Protect) | No | Yes |
| Digest emails (Protect) | No | Yes |
| Multi-user auth | No | Yes |
| Yahoo / IMAP | No | Yes |

---

## Branding

| Mode | Tagline |
|---|---|
| Quiet | Your inbox, without the inbox. |
| Quiet Protect | Peace of mind for your family. |

---

*Quiet Phase 2 Architecture v2.0 — internal working document — not for distribution*
