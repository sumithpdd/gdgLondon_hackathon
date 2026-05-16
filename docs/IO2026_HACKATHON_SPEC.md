# IO 2026 Hackathon — data model & implementation spec

This document tracks the **GDG London Hackathon** (`io2026Hackathon_*`) rollout, the optional **Buddies** networking feature (separate from the event title), and how they relate to archived **iwd2026Hackathon** data.

Reference app patterns: [AI_DevCamp_BuildwithAI](https://github.com/sumithpdd/AI_DevCamp_BuildwithAI).

---

## 1. Collection naming

| Purpose | Live (empty until populated) | Archive (post-migration from `hackaton*`) |
|--------|------------------------------|-------------------------------------------|
| Users | `io2026Hackathon_users` | `iwd2026Hackathon_users` |
| Projects | `io2026Hackathon_projects` | `iwd2026Hackathon_projects` |
| Join requests | `io2026Hackathon_joinRequests` | `iwd2026Hackathon_joinRequests` |
| Buddy requests | `io2026Hackathon_buddyRequests` | `iwd2026Hackathon_buddyRequests` (read-only archive) |
| Votes | `io2026Hackathon_votes` | `iwd2026Hackathon_votes` |
| Attendance | `io2026Hackathon_attendance` | `iwd2026Hackathon_attendance` |
| Settings | `io2026Hackathon_settings` (doc `main`) | `iwd2026Hackathon_settings` |
| Winners | `io2026Hackathon_winners` | `iwd2026Hackathon_winners` |
| Discussions | `io2026Hackathon_discussions` | `iwd2026Hackathon_discussions` |
| Updates | `io2026Hackathon_updates` | `iwd2026Hackathon_updates` |
| Credit claims | `io2026Hackathon_creditClaims` | `iwd2026Hackathon_creditClaims` |

Legacy collections (`hackatonUsers`, `hackatonProjects`, …) remain until you migrate and optionally delete them. With **`NEXT_PUBLIC_HACKATHON_DATASET` unset**, votes / attendance / winners use parallel legacy names: `hackatonVotes`, `hackatonAttendance`, `hackatonWinners` (not `io2026Hackathon_*`).

---

## 2. Environment switches

| Variable | Effect |
|----------|--------|
| `NEXT_PUBLIC_HACKATHON_DATASET=io2026` | App reads/writes **all** active hackathon collections under `io2026Hackathon_*` (see `lib/hackathon-collections.ts`). |
| *(unset)* | App uses legacy `hackaton*` for users/projects/joinRequests/settings, and `hackatonVotes` / `hackatonAttendance` / `hackatonWinners` for those features (see `lib/hackathon-collections.ts`). |

**Cloud Functions:** set `PROJECTS_COLLECTION`, `USERS_COLLECTION`, `JOIN_REQUESTS_COLLECTION`, `CONFIG_COLLECTION`, and optionally `CONFIG_DOC` (`main` for IO settings) to match the app. Defaults in `functions/src/index.ts` still point at legacy names if env is unset — **set env to IO names before production IO 2026**.

Planned (attendance / voting — implement before exposing UI):

| Variable | Purpose |
|----------|---------|
| `ATTENDANCE_COLLECTION` | e.g. `io2026Hackathon_attendance` |
| `VOTES_COLLECTION` | e.g. `io2026Hackathon_votes` |

---

## 3. Migration

```bash
# Service account with Firestore read/write
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run migrate:iwd-archive
# Dry run:
node scripts/migrate-to-iwd-archive.mjs --dry-run
```

Copies: users, projects (+ `comments` subcollection), join requests, config → settings, discussions, updates, credit claims; derives `iwd2026Hackathon_winners` from projects with `place` in `first|second|third`. Does **not** delete legacy data.

---

## 4. Firestore rules

`firestore.rules` includes:

- `getUserRole`: prefers `io2026Hackathon_users/{uid}`, else `hackatonUsers/{uid}` (transition).
- Full rules for `io2026Hackathon_*` (mirrors legacy project/join behaviour).
- **Archive** `iwd2026Hackathon_*`: client **read-only**; writes via Admin SDK / migration only.

Deploy: `firebase deploy --only firestore:rules`

---

## 5. Branding & user-facing copy

| Constant | Value / role |
|----------|----------------|
| `HACKATHON_BRAND_NAME` / `HACKATHON_DISPLAY_NAME` | **`GDG London Hackathon`** — headers, register, vote/check-in/live stubs, submit blurb, layout. |
| `BUDDIES_FEATURE_LABEL` | **`Buddies`** — nav item, `/hackathon/buddies`, profile networking card only. |

Do **not** fold “Buddies” into the main hackathon product title. Networking copy lives next to `BUDDIES_FEATURE_LABEL` and `/hackathon/buddies`.

**Single source of dates:** `lib/constants.ts` — `HACKATHON_IDEA_SUBMISSION_OPENS`, `HACKATHON_SUBMISSION_DEADLINE`. Docs and UI should derive messaging from those constants (or this table kept in sync).

---

## 6. Submission timeline (IO 2026)

| Milestone | Date (London) | ISO (code) |
|-----------|---------------|------------|
| Idea submission opens | **17 May 2026**, start of day | `2026-05-17T00:00:00+01:00` |
| Final submission deadline | **19 May 2026**, **8:00 PM** | `2026-05-19T20:00:00+01:00` |

Constants: `HACKATHON_IDEA_SUBMISSION_OPENS`, `HACKATHON_SUBMISSION_DEADLINE` in `lib/constants.ts`. Timeline helpers: `lib/hackathon-timeline.ts` (re-exported from `lib/deadline.ts`).

**UI:** “Submissions opening soon” before opens; form locked before opens and after final deadline for edits (see **project submission** on `/hackathon/my-projects`).

### 6b. Project submission vs hackathon profile (team-join score)

**Policy (implemented + documented):**

- **Creating a new project / saving a draft** does **not** require `getProfileCompletion` (bio, LinkedIn, team preference, in-person attendance). Lowers friction for early ideas.
- **Final submission** still requires demo video, GitHub, screenshots, etc. (same validation as before; UI lives on **`/hackathon/my-projects`**). It does **not** currently require the team-join profile; organisers may tighten this later.
- **Idea gallery “Request to join”** continues to use **`isHackathonProfileComplete` / `getProfileCompletion`** on the client (see `/hackathon/ideas`).

The **project submission** card shows an **optional** amber callout when the team-join profile is incomplete, with a control to jump to profile details (see spec reference in code).

**Canonical URL:** `/hackathon/my-projects?project=1` (and `&edit=<projectId>` when editing). **`/submit`** redirects there for backwards compatibility.

---

## 7. Routes & canonical URLs

| Route | Status / notes |
|-------|----------------|
| `/` | Landing |
| `/register` | Stub — Firebase sign-in explainer |
| `/hackathon/profile` | **Canonical** hackathon + Buddies directory settings (`/profile` **redirects** here) |
| `/hackathon/my-projects` | Your project + **draft / final submission** form (deep link `?project=1`; team **members** see list only — owners submit) |
| `/hackathon/buddies` | Buddies hub: Discover / Requests / My buddies (+ Admin tab for `role === admin`) |
| `/ideas` | Redirect → `/hackathon/ideas` |
| `/ideas/create` | Redirect → `/hackathon/my-projects?project=1` |
| **`/hackathon/project/[id]`** | **Canonical project detail, share, and join context** |
| `/projects/:id` | **Redirect** → `/hackathon/project/:id` (`next.config.mjs`) |
| `/projects/:id/join` | **Redirect** → `/hackathon/project/:id` (join UX on project page / ideas flow) |
| `/submit` | **Redirect** → `/hackathon/my-projects?project=1` (optional `&edit=`) — submission UI + timeline gates live on **My project** |
| `/past-projects` | IWD archive projects |
| `/checkin` | **MVP** — self check-in + admin attendee list, optional `aidevcamp_flat` cohort tag (`lib/attendance.ts`). Room code / Functions validation still TODO. |
| `/vote`, `/live` | Stub pages; behaviour in §8–§10 — **Cloud Functions** for caps & aggregates still TODO |

---

## 8. Voting & attendance — implementation order

**Shipped (MVP):** `/checkin` writes to `ATTENDANCE_COLLECTION` with **document id = attendee `userId`**: self–service button, plus **admin** search over up to 400 user profiles and per-row **Check in**, with optional **`cohort: "aidevcamp_flat"`** for AI DevCamp flat guests (`lib/attendance.ts`). Deploy updated **`firestore.rules`** so admins may `create` attendance for others.

**Order:** (1) **Cloud Functions** (authoritative caps, live codes, audit) → (2) **`/vote` UI** + tighter `/checkin` + admin audit views → (3) **`/live`** read model.

### 8.1 Admin settings (`io2026Hackathon_settings/main`)

- `checkInCode` (e.g. 6-digit), rotation / expiry fields as needed.
- `votingOpensAt`, `votingClosesAt` (timestamps).
- Optional: `attendanceWindowOpensAt` / `attendanceWindowClosesAt`.
- Existing flags such as `winnersAnnounced` stay as today.

### 8.2 Suggested callable API (Gen 2 HTTPS)

Implement in `functions/src/index.ts` (names indicative):

| Callable | Auth | Behaviour |
|----------|------|-----------|
| `recordCheckIn` | Signed-in | Validates live code + window; writes one doc per user in `ATTENDANCE_COLLECTION`; idempotent per event/day as designed. |
| `castVotes` | Signed-in | Requires verified attendance; enforces **5 votes max** per user per voting window; writes to `VOTES_COLLECTION`; rejects duplicates / self-vote rules as product requires. |
| `adminSetCheckInCode` / `adminSetVotingWindow` | Admin only | Updates settings doc. |

Client-side rules are **not** sufficient for caps; Functions must validate.

### 8.3 Firestore shape (sketch)

- **Attendance:** `userId`, `checkedInAt`, `codeVersion` or `eventId`, `attendanceVerified: true`.
- **Votes:** `userId`, `projectId`, `createdAt`, `hackathonId: "io2026"`, optional `weight`; aggregate counts via query or aggregation documents.

### 8.4 Admin audit

- List attendance for window; export CSV optional.
- Vote tallies per project; detect anomalies (same-second bursts, etc.).

---

## 9. `/live` projector read model

**Goal:** read-optimised aggregates for a wall display (no writes from projector).

- **Aggregates:** pre-computed vote totals, “top N” projects, check-in count, optional rolling animations config in settings.
- **Source of truth:** still `VOTES_COLLECTION` / projects; aggregates updated by Functions on each `castVotes` **or** periodic scheduled function.
- **UI:** `/live` subscribes to a small set of docs (e.g. `io2026Hackathon_settings/liveSlide` + `io2026Hackathon_liveStats/summary`) for minimal churn and smooth animations.

**Status:** TODO — spec only until §8 callables exist.

---

## 10. Admin backlog (beyond current user list)

| Area | Work |
|------|------|
| **Prizes** | CRUD prizes; map winners → prize rows (`io2026Hackathon_winners` / labels). |
| **Voting windows** | Edit `votingOpensAt` / `votingClosesAt`; surface on `/vote` stub. |
| **Join requests** | Overview table: all `joinRequests` by status, project, searcher. |
| **User flags** | `active` / `checkedIn` / `votingEligible` denormalised on user doc **or** derived in admin UI from attendance — pick one pattern and document in `DATA_MODEL.md`. |

---

## 11. Prizes (admin) — detail

Configure prizes (headphones, keyboard, socks, bags); assign to winners via admin + `io2026Hackathon_winners` / project labels — **TODO** beyond current winner `place` fields on projects.

---

## 12. TypeScript types

See `types/io2026.ts` for draft interfaces (`Io2026User`, `Io2026Project`, `Io2026Vote`, …).

---

## 13. Go-live checklist (admin, settings, Functions, app env)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json   # if needed
npm run seed:io2026 -- --uid=YOUR_FIREBASE_AUTH_UID
# Dry run:  npm run seed:io2026 -- --uid=... --dry-run
# Source user not admin but you want them admin on IO:  add --force-admin
```

Then:

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy indexes if needed: `firebase deploy --only firestore:indexes`
3. Set Cloud Function env vars (`functions/.env.example` + planned `ATTENDANCE_COLLECTION` / `VOTES_COLLECTION`), then `firebase deploy --only functions`
4. In **`.env.local`**: `NEXT_PUBLIC_HACKATHON_DATASET=io2026` — restart Next.js / redeploy hosting

---

## 14. Immediate next steps for the team

1. Run migration in staging; verify `/past-projects`.
2. Implement **§8** callables + settings fields; deploy Functions.
3. Wire **`/vote`** to callables; tighten `/checkin` with live code when Functions land; add admin audit views.
4. Build **`/live`** aggregate docs + projector UI (§9).
5. Extend **admin** for prizes, voting windows, join-request overview, user flags (§10).
6. Keep sharing project URLs as **`/hackathon/project/[id]`**; `/projects/:id` remains a short redirect only.
