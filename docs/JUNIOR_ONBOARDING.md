# Junior developer onboarding — GDG London Hackathon

Welcome. This guide explains **what the app is**, **how data is stored**, **how users move through the product**, and **where to change code safely**. Read this before diving into random files.

**Also read:** [USER_FLOW.md](./USER_FLOW.md) (journeys), [DATA_MODEL.md](./DATA_MODEL.md) (Firestore schema), [ARCHITECTURE.md](./ARCHITECTURE.md) (code layers).

---

## What is this project?

A **Next.js** web app for the **GDG London Hackathon** (Build with AI × Google I/O 2026):

| Who | What they do |
|-----|----------------|
| **Participants** | Register, fill a **profile**, post a **project**, join teams via the **idea gallery**, **check in**, **vote**, browse **resources** |
| **Admins** | Manage **users**, **submissions**, **winners**, **voting**, **live projector**, **content** (rules/resources text) |
| **Everyone** | View **past hackathons** at `/past-projects` (archived IWD 2026 data) |

**Auth:** Firebase Authentication (email/password + Google) — not Clerk.

**Database:** Cloud Firestore (documents, like JSON rows in folders called collections).

**Files:** Firebase Storage (screenshots).

**Privileged writes:** Firebase **Cloud Functions** (server code that bypasses client security rules when needed).

---

## Tech stack (short)

| Piece | Role |
|-------|------|
| **Next.js 14** (`app/`) | Pages and routing — each `page.tsx` is a URL |
| **React** | UI components (`components/`) |
| **TypeScript** | Types on data shapes (`types/`) |
| **`lib/`** | Business logic — **prefer adding Firebase logic here**, not in components |
| **Tailwind + shadcn/ui** | Styling and buttons, dialogs, cards |
| **Firebase** | Auth, Firestore, Storage, Callable Functions |

---

## First day setup

```bash
git clone <repo-url>
cd gdgLondon_hackathon
npm install
```

1. Copy env: `.env.example` → `.env.local` (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)).
2. Set at minimum:
   ```bash
   NEXT_PUBLIC_HACKATHON_DATASET=io2026
   NEXT_PUBLIC_ACTIVE_HACKATHON_ID=io2026Hackathon
   # + all NEXT_PUBLIC_FIREBASE_* keys
   ```
3. Run: `npm run dev` → open `http://localhost:3000` (redirects to `/hackathon`).
4. Register a test user at `/register`, then complete `/hackathon/profile`.

**Make yourself admin:** Firebase Console → `io2026Hackathon_users` → your UID document → set `role` to `"admin"`. Redeploy rules if saves fail: `firebase deploy --only firestore:rules`.

---

## Repository map (where things live)

```
app/                          # Pages (URLs)
  hackathon/                  # Main hub: home, profile, ideas, my-projects, gallery, …
  admin/                      # Admin dashboard, users, voting, live, content, …
  register/                   # Sign up
  checkin/ vote/ live/        # Event-day features
  past-projects/              # Archived hackathon (read-only data)

components/                   # Reusable UI
  ui/                         # shadcn primitives (Button, Dialog, …)
  admin/                        # Admin-only dialogs (e.g. edit user)
  HackathonAppBar.tsx         # Top navigation
  ProjectSubmissionForm.tsx   # Create/edit project

lib/                          # ★ Put new Firebase / domain logic here
  auth.ts                     # Sign-in, user profile load
  join-requests.ts            # Team join requests, getUserProject
  project-submissions.ts      # Save progress / Ship it → io2026Hackathon_projects
  meApi.ts                    # Self check-in API wrappers
  attendance.ts               # Read attendance, isAidevcampCohort
  check-in.ts                 # Staff check-in, swag, AI DevCamp tag callables
  voting.ts                   # Vote page data, castVotes wrapper
  admin-users.ts              # List/filter users, provision by email, admin callables
  admin-nav.ts                # Grouped admin sidebar links
  profile-completion.ts       # “80% profile” score for joining teams
  hackathon-collections.ts      # Collection name prefixes (io2026 vs legacy)
  active-hackathon.ts         # Active edition id + event description from registry
  constants.ts                # Re-exports collection names, deadlines

types/                        # TypeScript interfaces (Submission, UserProfile, …)

functions/src/index.ts        # Cloud Functions (admin updates, votes, createProject, …)

firestore.rules               # Who can read/write what (security)
docs/                         # You are here
```

**Rule of thumb:** If you need Firestore in a **new** feature, add a function in `lib/something.ts` and call it from the page — see `.cursor/rules/architecture-ddd.mdc`.

---

## User flows (participant)

```mermaid
flowchart TD
  A[Landing /hackathon] --> B{Signed in?}
  B -->|No| C[/register or Sign in modal]
  C --> D[Firebase Auth + user doc created]
  B -->|Yes| E[/hackathon/profile]
  D --> E
  E --> F{What next?}
  F --> G[/hackathon/my-projects]
  G --> G1[Save progress - draft]
  G1 --> G2[Ship it - submitted]
  F --> H[/hackathon/ideas - join a team]
  F --> I[/hackathon/buddies]
  H --> J{Profile >= 80% team join score?}
  J -->|No| E
  J -->|Yes| K[Send join request]
  G2 --> L[Before HACKATHON_SUBMISSION_DEADLINE]
  L --> CI[/checkin - 6 digit code]
  CI --> V[/vote - audience ballot]
```

### Important product rules (2026)

| Feature | Rule |
|---------|------|
| **Idea gallery** (`/hackathon/ideas`) | Only projects for **current** `hackathonId` with `lookingForMembers: true` |
| **Join a team** | Profile needs **80%** “team join score” (bio, LinkedIn, team preference) — see `lib/profile-completion.ts` |
| **Your project on home** | Only shows if project’s `hackathonId` matches active edition (old SnippetPro-style projects are hidden) |
| **Past ideas/winners** | `/past-projects` reads **`iwd2026Hackathon_*`** archive |
| **Check-in** | `/checkin` — self + organiser desk (swag, AI DevCamp cohort); `/admin/checkin` redirects here |
| **Vote** | `/vote` after `attendanceVerified`; badges for AI DevCamp + swag |
| **Project save** | Always tags `hackathonId` + `userId` via `lib/project-submissions.ts` |

Full narrative: [USER_FLOW.md](./USER_FLOW.md).

---

## User flows (admin)

```mermaid
flowchart LR
  A[/admin] --> B[Submissions / winners]
  A --> C[/admin/users]
  A --> D[/admin/voting]
  A --> E[/admin/live]
  A --> F[/admin/content]
  C --> G[adminUpdateUser Function]
  C --> H[setUserRole Function]
  C --> I[adminProvisionHackathonUser]
```

- **Add user to hackathon:** `/admin/users` → **Add user to hackathon** → email must exist in Firebase Auth → `adminProvisionHackathonUser` creates/updates user doc with audit fields (`createdBy`, `updatedBy`, `createdDate`, `updatedDate`, `profileStatus: "provisioned"`).
- **Edit user / change role:** Uses Cloud Functions (`adminUpdateUser`, `setUserRole`) because client Firestore rules block cross-user writes.
- **User list:** `lib/admin-users.ts` (`listUsersForAdmin`, `filterAdminUsers`); badges in `components/admin/AdminUserBadges.tsx`.
- **User list filter:** Default “**Current hackathon only**” = users with `hackathonParticipations.io2026Hackathon`.
- **Delete project:** `deleteProject` callable from gallery/admin — not raw `deleteDoc` from browser.

---

## Data model (schema) — cheat sheet

Three layers (do not confuse them):

| Layer | Example | Purpose |
|-------|---------|---------|
| **Env dataset** | `NEXT_PUBLIC_HACKATHON_DATASET=io2026` | Which Firestore **prefix** the app uses: `io2026Hackathon_*` |
| **Registry** | `hackathons/io2026Hackathon` | Human name, **description** (Build with AI blurb), metadata |
| **Participation** | `users/{uid}.hackathonParticipations.io2026Hackathon` | “This user joined this edition” |

### Main collections (live IO 2026)

| Collection | Document ID | What it stores |
|------------|-------------|----------------|
| `io2026Hackathon_users` | Firebase Auth `uid` | Profile, `role`, `hackathonParticipations`, optional `adminProvisioned` / `profileStatus` |
| `io2026Hackathon_projects` | Auto ID | Submissions; includes `hackathonId`, `hackathonName`, `lookingForMembers`, `place` |
| `io2026Hackathon_joinRequests` | Auto ID | Pending/approved/rejected team joins |
| `io2026Hackathon_settings` | `main` | Prizes, voting windows, rules text, `winnersAnnounced` |
| `io2026Hackathon_votes` | Composite | Audience votes (writes **only** via `castVotes` function) |
| `io2026Hackathon_attendance` | `uid` | Check-in, `cohort` (AI DevCamp), `swagReceived` |
| `hackathons` | e.g. `io2026Hackathon` | Edition registry (description for home page) |

### Key project fields

```typescript
{
  projectTitle, teamName, appPurpose, githubUrl, demoVideoUrl,
  userId,              // owner
  status: "draft" | "submitted",
  lookingForMembers: boolean,   // show in idea gallery
  hackathonId: "io2026Hackathon",   // which edition
  hackathonName: "GDG London Hackathon",
  place: "first" | "second" | "third" | null,  // only admin/Functions set
  voteTotal: number,            // only Functions update
}
```

### Key user profile fields

```typescript
{
  uid, email, displayName, role: "user" | "moderator" | "admin",
  createdAt,                    // registration time (shown in admin)
  hackathonBio, city, country, teamPreference,
  programmingSkills, interests, expertise, techStack, canOfferTags,
  hackathonParticipations: {
    io2026Hackathon: { joinedAt: Timestamp }
  }
}
```

Full schema: [DATA_MODEL.md](./DATA_MODEL.md).

---

## Client vs Cloud Functions — when to use which

| Operation | Where it happens | Why |
|-----------|------------------|-----|
| User edits **own** profile | Client `updateDoc` on own user doc | Rules allow owner |
| Admin edits **another** user | `adminUpdateUser` callable | Rules + reliable admin check |
| Admin sets **role** | `setUserRole` callable | Updates all user collections if needed |
| Create / update project | `lib/project-submissions.ts` → Firestore `addDoc`/`updateDoc` | Rules enforce owner + `hackathonId`; `createProject` callable is fallback only |
| Cast votes | `castVotes` callable | Caps + check-in enforced |
| Set winner place | `setWinnerPlace` callable | Clients cannot set `place` |
| Delete project (admin) | `deleteProject` callable | Deletes join requests too |

If you see **“Missing or insufficient permissions”** in the browser, you are probably using **client SDK** for something that must use a **Function**.

---

## What is `motionDiv`? (Common confusion)

**`motionDiv` is not a library, package, or pattern used in this repo.**

It was a **recurring typo** in some edits: the intent was a normal HTML **`<div>`** (or, for animations, Framer Motion’s **`<motion.div>`**).

| What you might see | What it means |
|--------------------|----------------|
| `<motionDiv>` | **Wrong** — React does not know this tag → build fails |
| `<div>` | **Correct** — standard layout wrapper |
| `<motion.div>` | **Framer Motion** only if you `import { motion } from "framer-motion"` |

**If you grep the repo for `motionDiv`:** you should get **zero** matches. If any appear, rename them to `div` (or use real Framer Motion APIs on purpose).

**Junior takeaway:** When an error mentions `motionDiv`, replace that tag with a normal HTML **`div`**. There is no npm package to install.

---

## Environment variables juniors must know

| Variable | Meaning |
|----------|---------|
| `NEXT_PUBLIC_HACKATHON_DATASET` | `io2026` → live collections `io2026Hackathon_*` |
| `NEXT_PUBLIC_ACTIVE_HACKATHON_ID` | Registry + participation key (default `io2026Hackathon`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (safe in client) |
| Functions env (`functions/.env`) | `PROJECTS_COLLECTION`, `USERS_COLLECTION`, etc. — must match app |

Details: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

---

## Useful commands

```bash
npm run dev          # Local app
npm run build        # Production build (run before PR)
npm run lint         # ESLint
firebase deploy --only firestore:rules
firebase deploy --only functions
npm run migrate:iwd-archive   # Copy legacy → iwd archive (ops; needs service account)
npm run seed:io2026 -- --uid=YOUR_UID --with-registry --force-settings
```

---

## Safe places to make your first change

| Task | Start here |
|------|------------|
| Copy on a page | `app/hackathon/.../page.tsx` |
| Button / layout | `components/` + Tailwind classes |
| Profile field validation | `lib/profile-completion.ts` |
| New Firestore read | New or existing `lib/*.ts` |
| Admin-only action | `functions/src/index.ts` + thin wrapper in `lib/` |
| Collection name | **Never hardcode** — use `PROJECTS_COLLECTION` from `lib/constants.ts` |

---

## Glossary

| Term | Meaning |
|------|---------|
| **Edition / hackathonId** | Logical event id (`io2026Hackathon`) stored on projects and participation |
| **Dataset** | Firestore prefix family (`io2026Hackathon_*` vs old `hackaton*`) |
| **Callable** | HTTPS Cloud Function invoked from client with `httpsCallable` |
| **Soft delete** | User gets `deletedAt` timestamp; not removed from DB |
| **Team join score** | 80% threshold from bio + LinkedIn + team preference |
| **Idea gallery** | Projects recruiting teammates (`lookingForMembers`) |

---

## Reading order (suggested)

1. This file (you are here)
2. [USER_FLOW.md](./USER_FLOW.md)
3. [DATA_MODEL.md](./DATA_MODEL.md)
4. [ARCHITECTURE.md](./ARCHITECTURE.md)
5. [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) when changing event rules or collections
6. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) when stuck
7. Repo root [AGENTS.md](../AGENTS.md) for AI assistant / contributor rules

---

## Getting help

1. Read the **browser console** (F12) and terminal where `npm run dev` runs.
2. Check Firebase Console → Firestore → correct collection (`io2026Hackathon_*`).
3. Confirm `.env.local` and that **Functions are deployed** if admin actions fail.
4. Search docs: [docs/README.md](./README.md) index.

Good luck — pick a small ticket (copy, a filter, a new profile field) and trace it from **page → lib → Firestore/Function**.
