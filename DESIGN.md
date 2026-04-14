# DESIGN.md

> Quiet visual design system.
> Owner: Aegient Ltd
> Last updated: 2026-04-14
> Source of truth for colour, typography, spacing, and component conventions.
> Claude Code reads this file automatically. Apply these values by default in all UI sessions.

---

## 1. Principles

Quiet's visual language is calm, direct, and functional. The UI should feel like a professional tool, not a consumer app. A few governing rules:

- **Restraint first.** Every decorative choice needs a reason. Default to less.
- **Semantic colour only.** Colour conveys meaning (routing state, threat level). Never use colour purely for decoration.
- **System font stack.** No web fonts. The UI should load instantly and feel native on any device.
- **Accessible contrast.** All text on background combinations meet WCAG AA. Do not introduce new colour pairs without verifying contrast.
- **Privacy boundary is a design constraint.** The family manager must not see the protected person's email body, links, or raw threat scores. Components that surface any of these are wrong regardless of how they look.

---

## 2. Colour

All colours are defined as CSS custom properties in `ui/src/index.css`. Never hardcode hex values in component files. Always use `var(--token-name)`.

### 2.1 Brand colours

| Token | Hex | Usage |
|---|---|---|
| `--teal` | `#1d9e75` | Trusted senders; "Agent running" indicator; positive confirmations; Trusted tab accent |
| `--coral` | `#d85a30` | Blocked routing state; left border on Blocked cards; Blocked tab accent |
| `--amber` | `#ef9f27` | Review routing state; left border on Review cards; Review tab accent |

These three colours map directly to the three manager queue states. Do not use them outside of that semantic context.

### 2.2 Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#ffffff` | Card surfaces, topbar, tab bar, modals, panels |
| `--bg-secondary` | `#f5f4f0` | Inline tags, account email badge, secondary containers |
| `--bg-tertiary` | `#eeece7` | Page background (body default) |
| `--bg-info` | `#e6f1fb` | Informational highlights; matches info avatar palette |
| `--bg-success` | `#e1f5ee` | Delivered state badges; high confidence badge; trusted state indicator |
| `--bg-warning` | `#faeeda` | Review state badge; medium confidence badge |
| `--bg-danger` | `#faece7` | Blocked state badge; low confidence badge; error states; matches danger avatar palette |

### 2.3 Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#2c2c2a` | Body text, sender names, subject lines, headings |
| `--text-secondary` | `#5f5e5a` | Supporting text, domain labels, inactive tab labels |
| `--text-tertiary` | `#888780` | Timestamps, counts, placeholder text, empty state copy |
| `--text-info` | `#185fa5` | Informational text (on --bg-info) |
| `--text-success` | `#0f6e56` | Success text (on --bg-success) |
| `--text-warning` | `#854f0b` | Warning text (on --bg-warning) |
| `--text-danger` | `#993c1d` | Error text and danger state text (on --bg-danger) |

### 2.4 Borders

| Token | Value | Usage |
|---|---|---|
| `--border-subtle` | `rgba(44, 44, 42, 0.12)` | Default card borders, dividers, topbar/tab-bar bottom edge |
| `--border-mid` | `rgba(44, 44, 42, 0.22)` | Hover states on cards; focused inputs |

Use `0.5px` border width with `--border-subtle` for card outlines. `1px` feels too heavy against these backgrounds.

### 2.5 Tab active background shades

When a tab is active, a low-opacity background shade is applied. These are not tokenised -- they are derived from the tab's accent colour at 7% opacity:

- Review (amber): `rgba(209, 127, 0, 0.07)`
- Blocked (coral): `rgba(193, 66, 34, 0.07)`
- Trusted (teal): `rgba(15, 110, 86, 0.07)`

### 2.6 Avatar palettes

Avatars use six deterministic palettes selected by hashing the sender's email address. Use `avatarStyle(seed)` from `utils.js` -- do not select palettes manually.

| Palette | Background | Foreground |
|---|---|---|
| 1 (coral) | `#faece7` | `#993c1d` |
| 2 (blue) | `#e6f1fb` | `#185fa5` |
| 3 (teal) | `#e1f5ee` | `#0f6e56` |
| 4 (neutral) | `#f1efe8` | `#5f5e5a` |
| 5 (green) | `#eaf3de` | `#3b6d11` |
| 6 (purple) | `#eeedfe` | `#534ab7` |

---

## 3. Typography

### 3.1 Font stack

```css
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
```

System UI font stack. No web fonts. No icon fonts.

### 3.2 Type scale

All sizes in pixels. Use `px` directly in component inline styles.

| Size | Usage |
|---|---|
| 10px | Routing badge labels, confidence badge labels |
| 11px | Micro labels, timestamps, counts in tab bars, account email badge |
| 12px | Agent running indicator, secondary metadata |
| 13px | Card body text, subject lines, tab button labels, general UI text, empty states |
| 14px | Base body (from CSS default) |
| 15px | Topbar product title |

### 3.3 Font weights

| Weight | Usage |
|---|---|
| 400 | Body text, inactive tab labels, override reasons |
| 500 | Confidence badge text |
| 600 | Sender names, topbar title, active tab labels, routing badge labels, avatar initials |

### 3.4 Letter spacing

- Topbar product title: `letter-spacing: -0.3px`
- All other text: default (no explicit tracking)

---

## 4. Spacing

### 4.1 Page layout

- Max content width: `680px` for protect-mode views, centred with `margin: 0 auto`
- Page minimum height: `100svh`
- Inner content padding: `1.25rem` (20px) on horizontal edges, applied to list and detail containers

### 4.2 Sticky header layers

| Layer | Top offset | Z-index |
|---|---|---|
| Topbar | `0` | `100` |
| Tab bar | `52px` | `99` |

Topbar height is `52px`. Both layers use `position: sticky` and `background: var(--bg-primary)` to prevent content bleeding through.

### 4.3 Cards

- Padding: `14px 16px`
- Grid: `44px 1fr auto` (avatar / body / meta)
- Gap between avatar, body, meta: `12px`
- Margin between cards: `6px`
- Left accent border: `3px solid` (review = amber; block = coral)
- Card border: `0.5px solid var(--border-subtle)`

### 4.4 Badges

- Padding: `2px 7px`
- Border radius: `10px` (pill)
- No minimum width

### 4.5 Tab buttons

- Padding: `10px 16px`
- Active bottom border: `2px solid {tab-colour}`
- Inactive bottom border: `2px solid transparent` (prevents layout shift on activation)
- Bottom margin: `-0.5px` (seats the border flush with the container edge)
- Border radius on active: `4px 4px 0 0` (top corners only)

### 4.6 Avatar

- Size: `38px x 38px` (in cards), `44px` (reserved grid track)
- Shape: `border-radius: 50%`
- Font: `13px`, weight `600`

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-md` | `8px` | Smaller interactive elements (inputs, secondary containers) |
| `--radius-lg` | `12px` | Email cards, detail panels, modals |

Do not use radius values above `12px` for UI containers. Pill shapes (`border-radius: 10px`) are reserved for badges.

---

## 6. Motion and Transitions

### 6.1 Hover transitions

All hover state changes use:

```css
transition: color 0.15s, background 0.15s, border-color 0.15s;
```

Do not use longer durations. The UI should feel responsive, not animated.

### 6.2 Agent running indicator

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.45; transform: scale(0.8); }
}
animation: pulse-dot 2s ease-in-out infinite;
```

Applied to the 7x7px teal dot in the manager topbar only. Do not reuse this animation elsewhere -- it has a specific semantic meaning (live AI processing).

---

## 7. Component Inventory

### 7.1 Quiet Protect components (`ui/src/components/protect/`)

| Component | Responsibility |
|---|---|
| `ProtectApp` | Orchestrator -- state management, persona routing, account loading |
| `ManagerLayout` | Persistent topbar + tab bar shell for all manager views |
| `ManagerDashboard` | Email list for the active manager tab (Review / Blocked) |
| `ManagerCard` | Single email row in the manager queue |
| `ManagerEmailDetail` | Full detail view with threat signals and release/block actions |
| `TrustedSenderManager` | Trusted tab content -- list, add-by-address, per-entry remove |
| `ProtectedInbox` | Clean inbox for the protected person -- deliver-routed emails only |
| `ProtectedEmailDetail` | Email read view for the protected person -- no triage data |
| `PersonaToggle` | Switch between "Manager" and "Protected person's inbox" views |
| `ComposePanel` | Reply / forward / new message overlay -- mode-switched single component |

### 7.2 Quiet core components (`ui/src/components/`)

| Component | Responsibility |
|---|---|
| `InboxView` | Tab bar (Act / Handled / Suppressed) + email card list |
| `EmailDetail` | Full detail view with importance scoring, agent analysis, suggested action |
| `StateToggle` | Bottom-sheet routing state picker |

### 7.3 Shared utilities (`ui/src/utils.js`)

| Export | Purpose |
|---|---|
| `avatarStyle(seed)` | Deterministic `{bg, fg}` from sender email string |
| `formatDateTime(iso)` | Absolute timestamp: "13 Apr 2026, 09:42" -- used in manager views |
| `relativeTime(iso)` | Relative timestamp: "3h ago" -- used in protected person inbox |
| `humanizeSignal(signal)` | Raw signal identifier to plain English label |

---

## 8. Semantic Colour Mapping by Routing State

| State | Card left border | Tab accent | Badge background | Badge text |
|---|---|---|---|---|
| Review | `--amber` | `--amber` | `--bg-warning` | `--text-warning` |
| Blocked | `--coral` | `--coral` | `--bg-danger` | `--text-danger` |
| Trusted | n/a | `--teal` | n/a | n/a |
| Deliver / Delivered | n/a | n/a | `--bg-success` | `--text-success` |

Confidence badge uses the same bg/text pairs:

| Confidence | Background | Text |
|---|---|---|
| high | `--bg-success` | `--text-success` |
| medium | `--bg-warning` | `--text-warning` |
| low | `--bg-danger` | `--text-danger` |

---

## 9. Routing Labels

Routing values from the API are lowercase strings. Display labels are:

| API value | Display label |
|---|---|
| `review` | Review |
| `block` | Blocked |
| `deliver` | Delivered |

Use the `ROUTING_LABEL` map in components -- do not call `.toUpperCase()` or `.toTitleCase()` on raw API values.

---

## 10. Privacy Constraints (Design Rules)

These are product constraints, not style preferences. They must be enforced in every component that touches Quiet Protect manager views.

- **No email body in manager view.** The family manager cannot see the body of emails belonging to the protected person.
- **No raw threat score.** Do not surface numeric threat scores (`threat_score`, dimension values) in the manager view. Plain English threat reason (`threat_reason`) and humanised signal labels are the correct outputs.
- **No links or attachments.** Do not render or link to any URL extracted from the protected person's email in the manager view.

These rules apply unconditionally. They are not toggleable and are not gated behind any flag.

---

## 11. Do / Don't

**Do:**
- Always use `var(--token-name)` for colours -- never hardcode hex in component files
- Use `0.5px solid var(--border-subtle)` for card outlines
- Use `--radius-lg` (12px) for cards and panels; `--radius-md` (8px) for inputs and smaller elements
- Use `avatarStyle(seed)` for all avatar colours
- Use `formatDateTime()` for timestamps in manager views; `relativeTime()` for protected person inbox
- Use `humanizeSignal()` for all signal labels -- never render raw signal identifiers
- Use the `ROUTING_LABEL` map for routing state display labels
- Keep max content width at `680px` for protect-mode views
- Match font sizes to the scale in section 3.2 -- do not introduce new sizes

**Don't:**
- Use brand colours (teal, coral, amber) outside their semantic routing/state context
- Add shadow or elevation -- the design uses border + background contrast, not shadows
- Use `font-weight: 700` or heavier -- `600` is the maximum
- Use `border-radius` above `12px` on containers
- Use `1px` borders -- `0.5px` is the standard
- Add decorative illustrations, icons, or imagery to the Quiet Protect UI
- Surface the protected person's email content in any manager-facing component
- Use web fonts or icon fonts
- Use colour alone to convey information (ensure label text always accompanies colour badges)

---

## 12. Screen Inventory

Every screen in the live UI, the component that renders it, the persona that sees it, and its key states. Use this as the authoritative reference when scoping UI sessions.

Component paths are relative to the `quiet` private repo root (`/Users/chrisfalck/quiet/`).

### Quiet Protect -- Manager persona

**Manager Queue** (`ManagerLayout` + `ManagerDashboard`)
`ui/src/components/protect/ManagerLayout.jsx` + `ui/src/components/protect/ManagerDashboard.jsx`
- Persona: Manager
- Tabs: Review (amber), Blocked (coral), Trusted (teal)
- Content: email cards with sender, subject, absolute timestamp, routing badge, confidence badge
- Privacy rule: no email body, no raw threat score, no links
- States: loading, empty ("Nothing waiting for review." / "No blocked emails."), populated list
- Sticky header: topbar (52px) + tab bar (top: 52px); both use bg-primary

**Manager Email Detail** (`ManagerLayout` + `ManagerEmailDetail`)
`ui/src/components/protect/ManagerLayout.jsx` + `ui/src/components/protect/ManagerEmailDetail.jsx`
- Persona: Manager
- Accessible from: tapping any card in Review or Blocked tab
- Shows: sender name + address, subject, received date, routing badge, confidence badge, threat reason (plain English), signal list (humanised via humanizeSignal)
- Privacy rule: no email body, no raw threat score, no links
- Action block (routing = review): Release to inbox (reason dropdown required; button disabled until selected) + Confirm block (single tap, no dropdown)
- Action block (routing = block): Release to inbox (reason dropdown required) only
- Action block (routing = deliver): informational only, no action buttons
- Trust-and-release modal: "Trust [address] and release this email?" -- on confirm: addTrustedSender then overrideEmail('deliver') then onActionComplete
- States: loading, error, loaded; submitting state on action buttons

**Trusted Sender Manager** (`ManagerLayout` + `TrustedSenderManager`)
`ui/src/components/protect/ManagerLayout.jsx` + `ui/src/components/protect/TrustedSenderManager.jsx`
- Persona: Manager
- Accessible from: Trusted tab
- Shows: list of trusted senders (teal-bordered cards); add-by-address form (email required, name optional)
- Actions: Add sender (form submit), Remove sender (per card, no confirmation required)
- States: loading, empty, populated list; inline error on add failure
- Note: adding from this tab has no release side effect; trust-and-release is only available from email detail

### Quiet Protect -- Protected person persona

**Protected Inbox** (`ProtectedInbox`)
`ui/src/components/protect/ProtectedInbox.jsx`
- Persona: Protected person
- Shows: only emails with routing = deliver; sender name, subject, relative timestamp
- No triage data of any kind -- no routing badges, confidence badges, or override controls
- States: loading, empty ("Your inbox is empty."), populated list
- Auto-refreshes when manager releases an email to inbox (inboxRefreshKey increment in ProtectApp)

**Protected Email Detail** (`ProtectedEmailDetail`)
`ui/src/components/protect/ProtectedEmailDetail.jsx`
- Persona: Protected person
- Accessible from: tapping any inbox card
- Shows: sender name, sender address, subject, received date, full body
- No triage data of any kind
- Actions: Reply, Forward (both open ComposePanel); fires recordOpen() on mount
- States: loading, error, loaded

**Compose Panel** (`ComposePanel`)
`ui/src/components/protect/ComposePanel.jsx`
- Persona: Protected person
- Accessible from: New Message button in inbox topbar (new); Reply + Forward buttons in email detail
- Modes: reply | forward | new -- single component, mode-switched
- Fields: To (pre-filled on reply/forward), Subject (pre-filled on forward), Body
- States: idle, submitting, inline error on failure, closes on success

### Shared

**Persona Toggle** (`PersonaToggle`)
`ui/src/components/protect/PersonaToggle.jsx`
- Visible in both personas
- Labels: "Manager" / "Protected person's inbox"; "Viewing as" context label
- Persists to `quiet_persona` localStorage key; survives hard refresh

### Quiet core

**Inbox View** (`InboxView`)
`ui/src/components/InboxView.jsx`
- Tabs: Act, Handled, Suppressed
- Email cards: sender, subject, routing badge, confidence badge, relative timestamp
- States: loading, empty, populated list

**Email Detail** (`EmailDetail`)
`ui/src/components/EmailDetail.jsx`
- Shows: importance score bars, threat score, agent analysis, suggested action, agent note, override history
- Action: StateToggle opens routing state picker

**State Toggle** (`StateToggle`)
`ui/src/components/StateToggle.jsx`
- Bottom-sheet picker for routing state change with optional reason text
- Quiet core only -- manager routing override in Quiet Protect is handled by ManagerEmailDetail

### Loading / empty / error states (all screens)

- Loading: `var(--text-tertiary)`, 13px, centred, `padding: 2rem 0`
- Empty: `var(--text-tertiary)`, 13px, centred, `padding: 3rem 0`
- Error: `var(--text-danger)`, 13px, `padding: 1rem 0`
- All fetches show a loading state before resolving. Errors surface inline, never as full-page overlays.
