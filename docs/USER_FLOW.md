# User Flow — GDG London Hackathon

Participant journey from landing through auth, profile, projects, and past editions.

---

## Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   1. OVERVIEW          2. AUTH                    3. PARTICIPATE              │
│   ───────────          ─────                    ──────────────                │
│   /hackathon           /register (sign up)      Profile → Ideas / My project  │
│   Prizes, CTAs         /hackathon?login=1        Buddies, Gallery, Past       │
│                        (sign in modal)                                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Overview

**Route:** `/hackathon`

**What the user sees:**
- Hero, timeline, prize carousel (from Firestore `settings/main.prizes` or defaults)
- CTAs: submit project, browse ideas, gallery
- **Sign in** / **Register** in the app bar (guests)

**Not signed in:** gated actions open sign-in or link to `/register`.

---

## Step 2: Sign in or register

Aligned with [AI DevCamp Build with AI](https://github.com/sumithpdd/AI_DevCamp_BuildwithAI) auth UX.

### Sign in

| Entry | Behaviour |
|-------|-----------|
| App bar **Sign in** | Opens sign-in modal (`HackathonAuthShell` + `AuthModal`) |
| `/hackathon?login=1` | Opens modal on load (query stripped from URL) |
| `/hackathon?login=1&reset=1` | Modal in **forgot password** mode |
| `/hackathon?login=1&redirect=/hackathon/ideas` | After success → redirect path |

**Modal (`components/AuthModal.tsx`):**
- **Continue with Google** (popup on desktop; redirect on mobile)
- Email + password
- **Forgot password?** → reset email via Firebase
- Link to **Register** → `/register`

**Libraries:** `lib/auth.ts` (`loginWithEmail`, `loginWithGoogle`, `sendPasswordResetToEmail`), `lib/firebaseAuthErrors.ts`.

### Register

**Route:** `/register`

- Dedicated page (not a stub): Google + name / email / password
- After success → **`/hackathon/profile`**
- Footer: **Sign in** → `/hackathon?login=1`, **Forgot password?** → `/hackathon?login=1&reset=1`

### After authentication

1. Firebase Auth session established
2. `createOrUpdateUserProfile` writes/merges active **`users`** doc (`io2026Hackathon_users` when dataset=io2026)
3. `recordHackathonParticipationIfNeeded` merges **`hackathonParticipations.{activeHackathonId}`** (default `io2026Hackathon`)
4. Header shows profile, buddies, my projects, sign out

**Recommended next step:** complete **`/hackathon/profile`** before **Request to join** on **`/hackathon/ideas`**.

---

## Step 3: Participate

### Option A: Complete hackathon profile

**Route:** `/hackathon/profile` (`/profile` redirects here)

Bio, location, tags, Buddies directory opt-in, in-person attendance — used by **`isHackathonProfileComplete`** for idea gallery join requests.

### Option B: Idea gallery — request to join

**Route:** `/hackathon/ideas` (`/ideas` redirects)

- Projects with **looking for members** for the **active** `hackathonId` only (not past editions)
- **Request to join** requires **≥ 80%** team join score (bio, LinkedIn, team preference) — see `lib/profile-completion.ts`
- Guests: **Sign in to Request to Join** → opens sign-in with redirect
- Past ideas and winners: **`/past-projects`** (IWD 2026 archive)

### Option C: Create / submit project

**Route:** `/hackathon/my-projects` (`?project=1`, `&edit=<id>`)

- Project card + draft/final submission form
- **`/submit`** and **`/ideas/create`** redirect here
- Timeline gates: `HACKATHON_IDEA_SUBMISSION_OPENS`, `HACKATHON_SUBMISSION_DEADLINE`

### Option D: Browse gallery & participants

| Route | Purpose |
|-------|---------|
| `/hackathon/gallery` | All submitted projects |
| `/hackathon/participants` | Counts and project list |

### Option E: Buddies

**Route:** `/hackathon/buddies` — directory, requests, connections (see `BUDDIES_FEATURE_LABEL`).

### Option F: Resources & rules

**Route:** `/hackathon/resources` — learning links **and** hackathon rules (`#rules` anchor).

**`/hackathon/rules`** redirects to `/hackathon/resources#rules` (single combined page).

### Option G: Past hackathons

**Route:** `/past-projects`

- **Competition winners** + stats (total / submitted / drafts / winners selected) from **`iwd2026Hackathon_projects`**
- Archived project cards
- Side-event card (Garden of the Forgotten Prompt)

---

## Admin flows (summary)

| Route | Purpose |
|-------|---------|
| `/admin` | Submissions, winner places, results summary |
| `/admin/hackathons` | Registry CRUD, seed prizes to settings |
| `/admin/users` | Edit profiles (full fields like participant profile), roles, soft delete; filter **current hackathon**; **Registered** date shown |
| `/admin/hackathons` | Seed **Build with AI** description on `hackathons/{activeId}` |

**Admin saves:** profile/role changes use Cloud Functions (`adminUpdateUser`, `setUserRole`) — see [JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md).

---

## Flow summary table

| Step | Action | Route / location |
|------|--------|------------------|
| 1 | See overview | `/hackathon` |
| 2a | Sign in | App bar or `/hackathon?login=1` |
| 2b | Register | `/register` |
| 2c | Reset password | `/hackathon?login=1&reset=1` |
| 3a | Complete profile | `/hackathon/profile` |
| 3b | Request to join team | `/hackathon/ideas` |
| 3c | Submit project | `/hackathon/my-projects?project=1` |
| 3d | Browse / gallery | `/hackathon/gallery`, `/hackathon/participants` |
| 3e | Buddies | `/hackathon/buddies` |
| 3f | Rules & resources | `/hackathon/resources` |
| 3g | Past results | `/past-projects` |

---

## Navigation (signed in)

| Tab / link | Route | Purpose |
|------------|-------|---------|
| Overview | `/hackathon` | Hub |
| My Projects | `/hackathon/my-projects` | Drafts & submission |
| Ideas | `/hackathon/ideas` | Join teams |
| Resources & rules | `/hackathon/resources` | Links + requirements |
| Prizes | `/hackathon/prizes` | Full prize list |
| Buddies | `/hackathon/buddies` | Networking |
| Profile | `/hackathon/profile` | Directory profile |
| Past projects | `/past-projects` | IWD archive |
| Check-in | `/checkin` | Required before voting |
| Vote | `/vote` | Audience ballot (after check-in) |

---

## Step 6: Check-in & voting (event day)

1. **Check in** at `/checkin` (self-service or admin) → `io2026Hackathon_attendance/{uid}` with `attendanceVerified: true`.
2. **Vote** at `/vote` when the admin voting window is open:
   - **Organisers** (`admin` / `moderator`): up to **10** votes, **max 2** per project.
   - **Everyone else**: up to **5** votes, **max 2** per project.
   - Cannot vote for your own project.
3. Votes sum into **`project.voteTotal`** (server-side via `castVotes` Cloud Function).
4. Admin assigns **1st / 2nd / 3rd** from vote totals at `/admin/voting` or manually on `/admin`.

**Judging lenses** (for voters): Uniqueness, Completeness, Fresh idea, Use of AI — see `/hackathon/resources#rules`.

---

## Quick reference

```
Overview → Sign in OR Register → Profile (for joins) → [Ideas | My project | Gallery | Buddies]
Event day → Check-in → Vote → Winners from vote totals (admin)
Past editions → /past-projects
```

---

## Related docs

- [JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md) — onboarding for new developers
- [DATA_MODEL.md](./DATA_MODEL.md) — collections, participation, prizes
- [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) — env switches, migration
- [FIREBASE_AUTH.md](./FIREBASE_AUTH.md) — auth implementation details
