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

**Functions env (attendance / voting — set on deploy):**

| Variable | Purpose |
|----------|---------|
| `ATTENDANCE_COLLECTION` | e.g. `io2026Hackathon_attendance` |
| `VOTES_COLLECTION` | e.g. `io2026Hackathon_votes` |
| `CONFIG_COLLECTION` | e.g. `io2026Hackathon_settings` (doc `main`, `checkInPublic`, `checkInSecrets`) |

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

| Milestone | Date (London) | Code constant |
|-----------|---------------|---------------|
| Idea submission opens | **17 May 2026**, start of day | `HACKATHON_IDEA_SUBMISSION_OPENS` |
| In-person event | **18 May 2026** → **19 May 18:00** | `HACKATHON_EVENT_START_DATE`, `HACKATHON_EVENT_END_DATE` |
| Final submission deadline | **19 May 2026**, **8:00 PM** | `HACKATHON_SUBMISSION_DEADLINE` |

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
| `/checkin` | Self check-in + organiser desk (code, search, **swag**, **AI DevCamp 2026** cohort). Admin nav: Operations → Check-in desk. |
| `/vote` | Audience ballot — search, budget bar, badges (AI DevCamp / swag). Requires check-in; **`castVotes`** updates `voteTotal`. |
| `/admin/voting` | Vote leaderboard, voting window, assign top 3 from votes |
| `/admin/projects` | All projects (draft + submitted) with full fields |
| `/live` | Projector — live vote leaderboard / pitch / welcome (§9) |
| `/admin/live` | Admin slide controls + refresh aggregates |
| `/admin/content` | CMS for resources links + rules sections (`settings/main`) |
| `/hackathon/photos` | **Event gallery** — public carousel (approved photos & videos); attendee multi-upload |
| `/admin/photos` | Gallery upload, pending moderation, reorder/rename editor (Admin → Content) |

---

## 8. Voting & attendance — shipped

### 8.1 Check-in

| Piece | Location |
|-------|----------|
| Self check-in UI | `components/checkin/SelfCheckInCard.tsx` on `/checkin` |
| Organiser desk | `components/checkin/StaffAttendeeCheckIn.tsx` — search, filters, swag, AI DevCamp tag |
| Self check-in API | `POST /api/me/attendance/self-check-in` (`lib/meApi.ts`) |
| Staff callables | `staffCheckInUser`, `setAttendeeSwag`, `resetUserAttendance`, `getCheckInDeskCode` |
| Attendance reads | `lib/attendance.ts` — `getAttendanceForUser`, `isAidevcampCohort` |
| Staff helpers | `lib/check-in.ts` — `tagAttendeeAidevcamp2026`, `setAttendeeSwag` |

**Settings docs:** `checkInPublic` (window flags, public read) · `checkInSecrets` (hashed code, server-only).

**Attendance doc id** = `userId`. Fields: `attendanceVerified`, `method`, `cohort` (`aidevcamp2026`), `swagReceived` — full schema in [DATA_MODEL.md](./DATA_MODEL.md).

### 8.2 Voting

| Piece | Location |
|-------|----------|
| Vote UI | `app/vote/page.tsx`, `components/vote/VoteProjectCard.tsx` |
| Client API | `lib/voting.ts` — `fetchVoteableProjects`, `fetchUserVotes` (index fallback), `castVotes` |
| Server enforcement | `castVotes`, `assignWinnersFromVotes` in `functions/src/index.ts` |
| Attendee badges | `components/attendance/AttendeeEventBadges.tsx` on `/vote` |

**Caps:** organisers 10 / participants 5 total; max 2 per project; check-in required; no self-vote.

**Admin:** `/admin/voting` — window + leaderboard + assign places from vote totals.

### 8.3 Callable API (implemented)

| Callable / API | Auth | Behaviour |
|----------------|------|-----------|
| `POST /api/me/attendance/self-check-in` | Signed-in | Validates code + window; writes attendance |
| `staffCheckInUser` | Organiser | Check-in by uid or email; optional `cohort: aidevcamp2026` |
| `setAttendeeSwag` | Organiser | `swagReceived` on checked-in attendee |
| `resetUserAttendance` | Admin | Clears attendance doc |
| `getCheckInDeskCode` | Organiser | Returns active desk code |
| `castVotes` | Signed-in | Ballot with caps + `voteTotal` update |
| `assignWinnersFromVotes` | Admin | Top 3 by `voteTotal` → `place` |
| `refreshLiveStats` | Admin | Rebuild `liveStats/summary` |
| `reserveEventPhotoUpload` | Signed-in attendee | Reserve slot (max 10), pending doc + `storagePath` |
| `finalizeEventPhotoUpload` | Signed-in attendee | Set `imageUrl` after Storage upload |
| `withdrawEventPhoto` | Owner or organiser | Delete media; frees attendee quota |

### 8.4 Event gallery (photos & videos) — shipped

| Piece | Location |
|-------|----------|
| Public page | `app/hackathon/photos/page.tsx` |
| Attendee upload | `components/photos/AttendeeEventPhotoUpload.tsx` + `EventPhotoMultiUpload.tsx` |
| Public carousel | `components/photos/EventPhotoGallery.tsx`, `EventPhotoCarousel.tsx`, `EventMediaPreview.tsx` |
| Admin panel | `components/admin/AdminEventPhotosPanel.tsx` |
| Gallery editor | `components/admin/EventPhotoGalleryEditor.tsx` — `sortOrder`, rename (`title`) |
| Domain logic | `lib/event-photos.ts`, `types/event-photo.ts` |

**Attendee path:** `reserveEventPhotoUpload` → Storage (`event_photos/{hackathonId}/{uid}/{photoId}`) → `finalizeEventPhotoUpload` → `status: pending` → admin **Approve** → public carousel.

**Admin path:** client `uploadEventPhoto` with `publishImmediately: true` → `status: approved` + `sortOrder`.

**Quota:** 10 items per user (server transaction). **Media:** images ≤ 10 MB; videos ≤ 50 MB.

**Deploy (gallery callables + rules):**

```bash
firebase deploy --only functions:hackathon:reserveEventPhotoUpload,functions:hackathon:finalizeEventPhotoUpload,functions:hackathon:withdrawEventPhoto,firestore:rules,storage
```

Schema: [DATA_MODEL.md](./DATA_MODEL.md#event-gallery-media-io2026hackathon_eventphotos). Journey: [USER_FLOW.md](./USER_FLOW.md#option-h-event-gallery-photos--videos).

### 8.5 Firestore indexes

Deploy with app: `firebase deploy --only firestore:indexes` — includes `io2026Hackathon_votes` (`userId` + `hackathonId`) and `io2026Hackathon_projects` (`status` + `voteTotal`).

### 8.6 Remaining polish (optional)

- CSV export of attendance / swag / cohort for ops
- Denormalised `votingEligible` on user doc (today derived from attendance at vote time)

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

## 14. Event-day runbook (organisers)

1. **Deploy** `firebase deploy --only firestore:rules,firestore:indexes,functions`
2. **Seed** settings if needed: `npm run seed:io2026 -- --uid=... --force-settings`
3. **Check-in desk** (`/checkin`): generate room code → attendees self-check-in or staff search-check-in
4. **AI DevCamp guests:** enable cohort checkbox or tap **AI DevCamp** on each row; attendees see badge on **`/vote`**
5. **Swag:** tap **Swag** per checked-in attendee (filter **Needs swag**)
6. **Voting window:** `/admin/voting` → set open/close → verify **`/vote`** after check-in
7. **Close:** assign top 3 from votes or manual `place` on dashboard; announce on **`/live`**
8. **Event gallery:** share **`/hackathon/photos`** link; moderate at **`/admin/photos`** (approve/remove); use **Gallery editor** to reorder and rename before/after the event

See [USER_FLOW.md](./USER_FLOW.md) for participant-facing journey diagrams.
