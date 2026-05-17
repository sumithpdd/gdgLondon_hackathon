# User Flow — GDG London Hackathon

Participant journey from landing through auth, profile, projects, event day, and past editions.

---

## Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              PARTICIPANT JOURNEY                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   1. DISCOVER              2. AUTH                     3. PARTICIPATE             │
│   ───────────              ─────                     ──────────────             │
│   /hackathon               /register (sign up)         Profile (directory)      │
│   Prizes, timeline         /hackathon?login=1          My project (save / ship)   │
│                            AuthModal (sign in)         Ideas · Gallery · Buddies  │
│                                                                                   │
│   4. EVENT DAY             5. PAST EDITIONS                                       │
│   ────────────             ────────────────                                       │
│   /checkin → /vote         /past-projects (IWD archive)                           │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Canonical project UX:** draft and final submission live on **`/hackathon/my-projects`**, not on the profile page. Profile is for directory / buddies settings only.

---

## Step 1: Overview

**Route:** `/hackathon`

**What the user sees:**
- Hero, timeline, prize carousel (from Firestore `settings/main.prizes` or defaults)
- CTAs: my project, browse ideas, gallery
- **Sign in** / **Register** in the app bar (guests)

**Not signed in:** gated actions open sign-in or link to `/register`.

---

## Step 2: Sign in or register

Aligned with [AI DevCamp Build with AI](https://github.com/sumithpdd/AI_DevCamp_BuildwithAI) auth UX.

### Sign in

| Entry | Behaviour |
|-------|-----------|
| App bar **Sign in** | Opens sign-in modal (`HackathonAuthShell` + `AuthModal`) |
| Protected route while guest | Redirect to `?login=1&redirect=<path>` |
| `/hackathon?login=1` | Opens modal on load (query stripped from URL) |
| `/hackathon?login=1&reset=1` | Modal in **forgot password** mode |
| `/hackathon?login=1&redirect=/hackathon/ideas` | After success → redirect path |

**Modal (`components/AuthModal.tsx`):**
- **Continue with Google** — popup on desktop; **redirect** on mobile / iOS (avoids popup blockers)
- Email + password
- **Forgot password?** → reset email via Firebase
- Link to **Register** → `/register`

**Libraries:** `lib/auth.ts`, `lib/auth-redirect.ts`, `lib/googleRedirectResult.ts`, `lib/firebaseAuthErrors.ts`.

### Register

**Route:** `/register`

- Dedicated page: Google + name / email / password
- After success → **`/hackathon/profile`**
- Footer: **Sign in** → `/hackathon?login=1`, **Forgot password?** → `/hackathon?login=1&reset=1`

### After authentication

1. Firebase Auth session established
2. `createOrUpdateUserProfile` writes/merges active **`users`** doc (`io2026Hackathon_users` when `NEXT_PUBLIC_HACKATHON_DATASET=io2026`)
3. `recordHackathonParticipationIfNeeded` merges **`hackathonParticipations.{activeHackathonId}`** (default `io2026Hackathon`)
4. Header shows profile, buddies, my projects, sign out

**Recommended next step:** complete **`/hackathon/profile`** before **Request to join** on **`/hackathon/ideas`** (80% team-join score).

---

## Step 3: Participate

### Option A: Hackathon profile (directory & buddies)

**Route:** `/hackathon/profile` (`/profile` redirects here)

Bio, location, tags, Buddies directory opt-in, in-person attendance — used by **`isHackathonProfileComplete`** for idea gallery join requests.

**Not used for:** project draft/final form (see Option C).

### Option B: Idea gallery — request to join

**Route:** `/hackathon/ideas` (`/ideas` redirects)

- Projects with **looking for members** for the **active** `hackathonId` only (`lib/hackathon-projects.ts`)
- **Request to join** requires **≥ 80%** team join score — see `lib/profile-completion.ts`
- Guests: **Sign in to Request to Join** → opens sign-in with redirect
- Past ideas and winners: **`/past-projects`** (IWD 2026 archive)

### Option C: Create / save / ship project

**Route:** `/hackathon/my-projects` (`?project=1`, `&edit=<id>`)

| Action | Button | `status` in Firestore | When |
|--------|--------|----------------------|------|
| Save work in progress | **Save progress** | `draft` (or stays `submitted` if already shipped) | Any time inside submission window |
| Final hand-in | **Ship it! — Final submission** | `submitted` | After required fields validate; before deadline |

**Redirects:** `/submit`, `/ideas/create` → `/hackathon/my-projects?project=1`

**Timeline gates:** `HACKATHON_IDEA_SUBMISSION_OPENS`, `HACKATHON_SUBMISSION_DEADLINE` (`lib/constants.ts`, `lib/hackathon-timeline.ts`)

#### Project save flow (technical)

```mermaid
sequenceDiagram
  participant U as Participant
  participant F as ProjectSubmissionForm
  participant L as lib/project-submissions
  participant FS as io2026Hackathon_projects

  U->>F: Save progress / Ship it
  F->>L: saveProjectDocument()
  L->>L: stampProjectOwnership(userId, hackathonId, hackathonName)
  alt Existing project id
    L->>FS: updateDoc
  else New project
    L->>FS: addDoc
    Note over L,FS: Callable createProject only if client add fails
  end
  F-->>U: Toast + project card updated
```

**Every project document must include:**
- `userId` — Firebase Auth uid (owner)
- `userEmail`
- `hackathonId` — e.g. `io2026Hackathon` (`NEXT_PUBLIC_ACTIVE_HACKATHON_ID`)
- `hackathonName` — display label from registry

**Collection:** `io2026Hackathon_projects` when `NEXT_PUBLIC_HACKATHON_DATASET=io2026` (see `lib/hackathon-collections.ts`). The collection is created on first write; no manual setup in Console.

**Policy:**
- **Save progress** does not require full profile completion (low friction for early ideas).
- **Ship it** requires demo video, GitHub, screenshots, etc.
- **Join a team** on `/hackathon/ideas` still requires profile completion (separate gate).

**Module:** `lib/project-submissions.ts` — `saveProjectDocument`, `findUserProjectForActiveHackathon`, `stampProjectOwnership`.

### Option D: Browse gallery & participants

| Route | Purpose |
|-------|---------|
| `/hackathon/gallery` | Submitted projects (`status: submitted`) |
| `/hackathon/participants` | Counts and project list |

### Option E: Buddies

**Route:** `/hackathon/buddies` — directory, requests, connections (`BUDDIES_FEATURE_LABEL`).

### Option F: Resources & rules

**Route:** `/hackathon/resources` — learning links **and** hackathon rules (`#rules` anchor).

**`/hackathon/rules`** redirects to `/hackathon/resources#rules`.

### Option G: Past hackathons

**Route:** `/past-projects`

- Winners + stats from **`iwd2026Hackathon_projects`**
- Archived project cards
- Side-event card (Garden of the Forgotten Prompt)

---

## Step 4: Event day — check-in & voting

### Check-in (`/checkin`)

Single page for everyone; organiser tools appear for `admin` / `moderator`.

| Who | What they do |
|-----|----------------|
| **Participant** | **Self check-in** — enter 6-digit room code during the check-in window (`SelfCheckInCard` → `POST /api/me/attendance/self-check-in`) |
| **Organiser** | Same page: **room code** panel + **attendee search** desk (`StaffAttendeeCheckIn`) |
| **Admin** | Can **reset attendance** for a user who checked in by mistake |

**Firestore:** `io2026Hackathon_attendance/{uid}` with `attendanceVerified: true` (writes via API / staff callables; client rules block arbitrary attendance creates).

**Legacy redirect:** `/admin/checkin` → `/checkin`.

### Voting (`/vote`)

After verified check-in, when admin voting window is open:

| Role | Vote budget | Per-project cap |
|------|-------------|-----------------|
| **Organiser** (`admin` / `moderator`) | 10 | 2 |
| **Participant** | 5 | 2 |

- Cannot vote for your own project.
- Votes aggregated server-side via **`castVotes`** Cloud Function → `project.voteTotal`.
- Admin assigns **1st / 2nd / 3rd** at `/admin/voting` or on `/admin`.

**Judging lenses:** Uniqueness, Completeness, Fresh idea, Use of AI — see `/hackathon/resources#rules`.

### Live projector

**`/live`** — vote leaderboard / pitch slides (read-only aggregates).  
**`/admin/live`** — slide controls.

---

## Admin flows (summary)

| Route | Purpose |
|-------|---------|
| `/admin` | Submissions, winner places, results summary |
| `/admin/hackathons` | Registry CRUD, seed prizes to settings |
| `/admin/users` | Profiles, roles, soft delete, provision by email |
| `/admin/voting` | Vote leaderboard, window, assign top 3 from votes |
| `/admin/content` | Resources links + rules sections |
| `/admin/errors` | Client/API error log (`error_logs` via Admin SDK) |
| `/checkin` | Self + organiser desk (not a separate admin-only URL) |

**Privileged writes:** profile/role changes, votes, winner places, delete project — Cloud Functions or Route Handlers with Admin SDK. See [JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md).

---

## Flow summary table

| Step | Action | Route / location |
|------|--------|------------------|
| 1 | See overview | `/hackathon` |
| 2a | Sign in | App bar or `/hackathon?login=1` |
| 2b | Register | `/register` |
| 2c | Reset password | `/hackathon?login=1&reset=1` |
| 3a | Complete directory profile | `/hackathon/profile` |
| 3b | Request to join team | `/hackathon/ideas` |
| 3c | Save draft / ship project | `/hackathon/my-projects?project=1` |
| 3d | Browse gallery | `/hackathon/gallery`, `/hackathon/participants` |
| 3e | Buddies | `/hackathon/buddies` |
| 3f | Rules & resources | `/hackathon/resources` |
| 3g | Past results | `/past-projects` |
| 4a | Check in | `/checkin` |
| 4b | Vote | `/vote` |

---

## Navigation (signed in)

| Tab / link | Route | Purpose |
|------------|-------|---------|
| Overview | `/hackathon` | Hub |
| My Projects | `/hackathon/my-projects` | Save progress & ship submission |
| Ideas | `/hackathon/ideas` | Join teams |
| Resources & rules | `/hackathon/resources` | Links + requirements |
| Prizes | `/hackathon/prizes` | Full prize list |
| Buddies | `/hackathon/buddies` | Networking |
| Profile | `/hackathon/profile` | Directory profile (not project form) |
| Past projects | `/past-projects` | IWD archive |
| Check-in | `/checkin` | Self-service + organiser desk |
| Vote | `/vote` | Audience ballot (after check-in) |

---

## Quick reference

```
Overview → Sign in OR Register → Profile (for team joins)
         → My project: Save progress → Ship it (io2026Hackathon_projects + hackathonId)
         → Ideas / Gallery / Buddies
Event day → Check-in (/checkin) → Vote → Admin winners
Past editions → /past-projects
```

---

## Related docs

- [JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md) — onboarding for new developers
- [DATA_MODEL.md](./DATA_MODEL.md) — collections, participation, prizes, project fields
- [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) — env switches, migration, routes
- [ARCHITECTURE.md](./ARCHITECTURE.md) — `lib/project-submissions.ts`, API routes, Functions
- [FIREBASE_AUTH.md](./FIREBASE_AUTH.md) — auth implementation details
