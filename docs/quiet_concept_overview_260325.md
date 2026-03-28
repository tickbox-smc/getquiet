# Quiet
## Your inbox, without the inbox.

---

> Email is broken. Nobody talks about fixing it correctly.

Most people receive 50–150 emails a day. They open their inbox, scan the noise, miss what matters, and feel vaguely anxious about what they didn't get to.

Existing solutions — smarter inboxes, keyboard shortcuts, AI drafting — make the same experience faster. They don't change the experience.

Quiet does something different. It removes the inbox entirely and replaces it with a decision interface. You don't scan messages. You see what needs you, what was handled, and what was silenced — and nothing else.

---

## Three things Quiet does

**Act** — Surfaces only what needs a human decision. Everything else is handled or gone.

**Handle** — Replies, archives, logs, and routes email autonomously — and explains every decision.

**Suppress** — Mutes, unsubscribes, and auto-removes senders you repeatedly ignore.

---

## The problem with email today

Every productivity tool built around email assumes the same mental model: open your inbox, process what's inside, feel better. The inbox is the workspace.

This model has three fundamental problems.

### 01 — Volume is a UI problem, not a filtering problem

- Spam filters and smart folders reduce count but not cognitive load.
- You still open a list. You still scan. You still decide what to skip.
- The act of opening your inbox is itself the failure mode.

### 02 — AI assistance still requires the human to be present

- Superhuman, Copilot, and Shortwave make you faster at processing email.
- They do not process email without you.
- You are still the operator. The inbox is still your workspace.

### 03 — Unsubscribe is manual and reactive

- You have to notice a sender, decide to act, find the link, and click it.
- Most people never do. Noise accumulates silently over years.
- No product learns from your ignoring behaviour and acts on it for you.

### What people actually want

- To know if anything needs them — without opening a list.
- To trust that important things will never be missed.
- To stop thinking about email entirely.

---

## How Quiet works

Quiet runs a continuous agent loop against your mailbox. You never interact with email directly.

**The pipeline:**

`Ingest` → `Score` → `Route` → `Learn`

- **Ingest** — All accounts polled every 5 minutes.
- **Score** — Sender importance and actionability calculated for every message.
- **Route** — Each email is assigned to Act, Handle, or Suppress.
- **Learn** — Behavioural patterns updated continuously from your interactions.

### The scoring engine

Every email receives two scores, calculated from behavioural signals:

**Sender importance score**
- Boss, colleagues → Critical
- Banks, government → High
- Newsletters → Low
- Retail marketing → Suppress

**Actionability score**
- Needs reply
- Contains deadline
- Contains attachment
- FYI only / Promotional

### Ignore threshold logic

| Ignores | Action | Detail |
|---------|--------|--------|
| 5 | Mute | Sender disappears from all views until you re-enable. |
| 10 | Suggest unsubscribe | Quiet surfaces the sender for a one-tap unsubscribe decision. |
| 20 | Auto-unsubscribe | Quiet unsubscribes automatically (requires List-Unsubscribe header). |

### The agent note

Every autonomous action includes a plain-English explanation of why it was taken. Trust through transparency.

---

## Market opportunity & next steps

### Competitive landscape

| Product | Removes inbox? | Autonomous? | Learns ignores? | Explains actions? |
|---------|---------------|-------------|-----------------|-------------------|
| Gmail / Outlook | No | No | No | No |
| Superhuman | No | No | No | No |
| SaneBox | No | Partial | No | No |
| Lindy | No | Partial | No | No |
| **Quiet** | **Yes** | **Yes** | **Yes** | **Yes** |

### Why now

- **LLM capability** — Sender classification, actionability detection, and auto-reply are all solvable with current models at acceptable cost.
- **Microsoft Graph API** — Single API covers Outlook and M365 — the dominant email platform in professional life.
- **Agent infrastructure** — Platforms like AgentMail (YC S25, $6M seed) prove the market is ready for email-native agents.
- **Universal pain** — Email overload affects every knowledge worker. The TAM is not niche.

### Prototype roadmap

**Phase 1 — UI prototype**
Decision interface with mocked data. Validate concept with 5–10 people.

**Phase 2 — Live inbox**
Connect Microsoft Graph API. Score real emails from M365 and Outlook.

**Phase 3 — Agent actions**
Auto-archive, auto-reply, unsubscribe. Behavioural learning loop.

**Phase 4 — SaaS evaluation**
Onboard 10 beta users. Measure open rate vs. inbox open rate.

---

*Quiet is a prototype concept. This document is for early feedback only — not for distribution.*
