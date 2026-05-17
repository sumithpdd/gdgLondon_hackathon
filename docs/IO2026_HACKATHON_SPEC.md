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

**Global (not prefixed):**

| Collection | Purpose |
|------------|---------|
| `hackathons` | Edition registry (display name, slug, `dataCollectionKey`). Admin: `/admin/hackathons`. |

Legacy collections (`hackatonUsers`, `hackatonProjects`, …) remain until you migrate and optionally delete them. With **`NEXT_PUBLIC_HACKATHON_DATASET` unset**, votes / attendance / winners use parallel legacy names: `hackatonVotes`, `hackatonAttendance`, `hackatonWinners` (not `io2026Hackathon_*`).

---

## 1b. Multi-hackathon model (three layers)

The platform supports **multiple hackathon editions** without duplicating the whole app:

| Layer | Mechanism | What it controls |
|-------|-----------|------------------|
| **Active data** | `NEXT_PUBLIC_HACKATHON_DATASET` | Which Firestore collection **prefix** the app uses (`io2026Hackathon_*` vs `hackaton*`). |
| **Registry** | `hackathons/{id}` | Human-readable edition metadata; admin CRUD. |
| **Participation** | `users.hackathonParticipations` | Map of registry id → `{ joinedAt }` for each edition a user joined. |

**Important:** Changing registry docs does **not** switch live data — only `NEXT_PUBLIC_HACKATHON_DATASET` does. Default participation id: `io2026Hackathon` (`NEXT_PUBLIC_ACTIVE_HACKATHON_ID`).

**Past editions:** archived data stays in `iwd2026Hackathon_*`; UI at `/past-projects` (winners + stats + project grid).

---

## 2. Environment switches

| Variable | Effect |
|----------|--------|
| `NEXT_PUBLIC_HACKATHON_DATASET=io2026` | App reads/writes **all** active hackathon collections under `io2026Hackathon_*` (see `lib/hackathon-collections.ts`). |
| *(unset)* | App uses legacy `hackaton*` for users/projects/joinRequests/settings, and `hackatonVotes` / `hackatonAttendance` / `hackatonWinners` for those features (see `lib/hackathon-collections.ts`). |
| `NEXT_PUBLIC_ACTIVE_HACKATHON_ID` | Registry id stored on user profile under `hackathonParticipations` (default `io2026Hackathon`). |
| `NEXT_PUBLIC_APP_URL` | Optional base URL for password-reset emails (sign-in flow). |

**Cloud Functions:** set `PROJECTS_COLLECTION`, `USERS_COLLECTION`, `JOIN_REQUESTS_COLLECTION`, `CONFIG_COLLECTION`, and optionally `CONFIG_DOC` (`main` for IO settings) to match the app. Defaults in `functions/src/index.ts` use **`io2026Hackathon_*`** when env is unset; still set explicit env on deploy so production matches Vercel.

**Client project writes:** primary path is `lib/project-submissions.ts` → Firestore `addDoc` / `updateDoc` on `PROJECTS_COLLECTION` with **`userId` + `hackathonId` stamped on every save**. Callable `createProject` is a **fallback** only if client create fails.

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

- `isAdmin()` / `isOrganiser()`: check `io2026Hackathon_users/{uid}` and legacy `hackatonUsers/{uid}` for role (transition).
- **`io2026Hackathon_projects`**: create/update require authenticated owner, non-empty **`hackathonId`**, and owner cannot change `hackathonId` or `voteTotal` on update.
- Full rules for other `io2026Hackathon_*` collections (mirrors legacy project/join behaviour where applicable).
- **`error_logs`**: deny all client access (Admin SDK / API routes only).
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

### 6a. Save progress vs Ship it

| UI label | Firestore `status` | Module |
|----------|-------------------|--------|
| **Save progress** | `draft` (preserves `submitted` if already shipped) | `lib/project-submissions.ts` → `saveProjectDocument` |
| **Ship it! — Final submission** | `submitted` | Same |

**Required on every write:** `userId`, `userEmail`, `hackathonId` (`io2026Hackathon`), `hackathonName`. Rules reject creates/updates without `hackathonId`.

**Load existing draft:** `findUserProjectForActiveHackathon(uid)` queries by `userId` + `hackathonId`; legacy rows missing `hackathonId` in `io2026Hackathon_projects` are picked up once and re-tagged on next save.

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
| `/register` | **Sign up** — Google + email/password; then `/hackathon/profile` |
| `/hackathon?login=1` | Opens **sign-in modal** (optional `&reset=1`, `&redirect=`) |
| `/hackathon/profile` | **Canonical** hackathon + Buddies directory settings (`/profile` **redirects** here) |
| `/hackathon/my-projects` | Your project + **draft / final submission** form (deep link `?project=1`; team **members** see list only — owners submit) |
| `/hackathon/buddies` | Buddies hub: Discover / Requests / My buddies (+ Admin tab for `role === admin`) |
| `/ideas` | Redirect → `/hackathon/ideas` |
| `/ideas/create` | Redirect → `/hackathon/my-projects?project=1` |
| **`/hackathon/project/[id]`** | **Canonical project detail, share, and join context** |
| `/projects/:id` | **Redirect** → `/hackathon/project/:id` (`next.config.mjs`) |
| `/projects/:id/join` | **Redirect** → `/hackathon/project/:id` (join UX on project page / ideas flow) |
| `/submit` | **Redirect** → `/hackathon/my-projects?project=1` (optional `&edit=`) — submission UI + timeline gates live on **My project** |
| `/past-projects` | IWD archive — **winners + stats** + project cards (`iwd2026Hackathon_projects`) |
| `/hackathon/resources` | Learning links + **rules** (`/hackathon/rules` → `#rules`) |
| `/hackathon/prizes` | Full prize list (from `settings/main.prizes`) |
| `/admin/hackathons` | Registry CRUD + seed IO 2026 prizes |
| `/checkin` | **MVP** — self check-in + admin attendee list, optional `aidevcamp_flat` cohort tag (`lib/attendance.ts`). Room code / Functions validation still TODO. |
| `/vote` | Audience voting UI → **`castVotes`** callable (check-in, caps, `voteTotal`) |
| `/admin/voting` | Vote leaderboard, voting window, assign top 3 from votes |
| `/live` | Projector — live vote leaderboard / pitch / welcome (§9) |
| `/admin/live` | Admin slide controls + refresh aggregates |
| `/admin/content` | CMS for resources links + rules sections (`settings/main`) |

---

## 8. Voting & attendance — implementation order

**Shipped:** `/checkin` — participants use **self check-in** (6-digit code, window from settings); **organisers** on the same page manage the public code and search-check-in attendees; **admins** can reset attendance. Attendance doc id = `userId` in `io2026Hackathon_attendance`. Client rules: attendance **create/update** denied — writes go through API routes / callables.

**Order (remaining polish):** tighter audit/export for attendance; optional cohort tags for flat guests.

### 8.1 Admin settings (`io2026Hackathon_settings/main`)

- `checkInCode` (e.g. 6-digit), rotation / expiry fields as needed.
- `votingOpensAt`, `votingClosesAt` (timestamps).
- Optional: `attendanceWindowOpensAt` / `attendanceWindowClosesAt`.
- Existing flags such as `winnersAnnounced` stay as today.
- **`prizes`** — array for carousel and `/hackathon/prizes` (see `lib/prizes.ts`, admin seed on `/admin/hackathons`).

### 8.2 Suggested callable API (Gen 2 HTTPS)

Implement in `functions/src/index.ts` (names indicative):

| Callable | Auth | Behaviour |
|----------|------|-----------|
| `recordCheckIn` | Signed-in | Validates live code + window; writes one doc per user in `ATTENDANCE_COLLECTION`; idempotent per event/day as designed. |
| `castVotes` | Signed-in | Requires verified attendance; **organisers (admin/moderator) 10 votes**, **participants 5**, **max 2 per project**; updates `VOTES_COLLECTION` + `project.voteTotal`; no self-vote. |
| `assignWinnersFromVotes` | Admin | Sets `place` on top 3 projects by `voteTotal` for active `hackathonId`. |
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

**Status:** Shipped — `io2026Hackathon_liveStats/summary` (rebuilt on `castVotes` + `refreshLiveStats`); `io2026Hackathon_settings/liveSlide` for projector mode; UI at **`/live`**, controls at **`/admin/live`**.

---

## 10. Admin backlog (beyond current user list)

| Area | Work |
|------|------|
| **Prizes** | CRUD prizes; map winners → prize rows (`io2026Hackathon_winners` / labels). |
| **Voting windows** | Edit `votingOpensAt` / `votingClosesAt`; surface on `/vote` stub. |
| **Join requests** | Overview table: all `joinRequests` by status, project, searcher. |
| **User flags** | `active` / `checkedIn` / `votingEligible` denormalised on user doc **or** derived in admin UI from attendance — pick one pattern and document in `DATA_MODEL.md`. |

---

## 11. Prizes

**Physical prize pool (IO 2026):** Sony wireless headphones, wireless keyboard, bag, Google socks — stored in **`settings/main.prizes`** (seed via admin or `npm run seed:io2026 -- --force-settings`).

| Surface | Source |
|---------|--------|
| Hub carousel | `fetchPrizesFromSettings()` → `DEFAULT_IO2026_PRIZES` fallback |
| `/hackathon/prizes` | Same |
| Admin seed | `/admin/hackathons` → “Seed IO 2026 prizes to settings” |

**Winner assignment:** admin dashboard sets `place` on project docs (`first` \| `second` \| `third`); `HackathonResultsSummary` on admin + `/past-projects`.

---

## 12. TypeScript types

See `types/io2026.ts` for draft interfaces (`Io2026User`, `Io2026Project`, `Io2026Vote`, …).

---

## 13. Go-live checklist (admin, settings, Functions, app env)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json   # if needed
npm run seed:io2026 -- --uid=YOUR_FIREBASE_AUTH_UID --with-registry
# Dry run:  npm run seed:io2026 -- --uid=... --dry-run
# Merge prizes into existing settings:  --force-settings
# Source user not admin but you want them admin on IO:  --force-admin
```

Then:

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy indexes if needed: `firebase deploy --only firestore:indexes`
3. Set Cloud Function env vars (`functions/.env.example` + planned `ATTENDANCE_COLLECTION` / `VOTES_COLLECTION`), then `firebase deploy --only functions`
4. In **`.env.local`**: `NEXT_PUBLIC_HACKATHON_DATASET=io2026` and optionally `NEXT_PUBLIC_ACTIVE_HACKATHON_ID=io2026Hackathon` — restart Next.js / redeploy hosting

---

## 14. Immediate next steps for the team

1. **Deploy** Firestore rules + indexes + Functions (`castVotes`, `assignWinnersFromVotes`).
2. Set Functions env (`functions/.env.example`) and run `npm run seed:io2026 -- --uid=... --force-settings` for prizes + judging criteria.
3. Configure **voting window** in `/admin/voting`; verify **check-in** then **`/vote`** end-to-end.
4. After voting closes: **Assign 1st/2nd/3rd from votes** or announce winners on dashboard.
5. Build **`/live`** projector (§9) — optional.
6. Per-hackathon **editable rules/resources** in admin CMS — optional; judging criteria already in `settings/main`.
