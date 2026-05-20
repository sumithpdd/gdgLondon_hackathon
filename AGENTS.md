# Agent / contributor notes

**GDG London Hackathon** — Next.js + Firebase. Security and clean boundaries come first; then component reuse and DDD-style `lib/` modules.

## Product (short)

Multi-edition hackathon platform. Live dataset: **IO 2026** (`io2026Hackathon_*` when `NEXT_PUBLIC_HACKATHON_DATASET=io2026`, the default). Auth: **Firebase Auth** (not Clerk). Admin via Firestore `role: "admin"` + Cloud Functions.

## Docs for humans

| Doc | Purpose |
|-----|---------|
| [docs/JUNIOR_ONBOARDING.md](docs/JUNIOR_ONBOARDING.md) | Start here — flows, repo map, patterns |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, modules, Functions |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | **Internal** schema — collections, fields, provisioned users |
| [docs/SECURITY.md](docs/SECURITY.md) | Secrets, public vs internal docs, rules |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Env names (no real values) |
| [docs/IO2026_HACKATHON_SPEC.md](docs/IO2026_HACKATHON_SPEC.md) | Product spec, routes, voting |
| [docs/USER_FLOW.md](docs/USER_FLOW.md) | Participant journey — save/ship, check-in, vote, event gallery |

## Cursor guidance

| Resource | Use |
|----------|-----|
| `.cursor/rules/architecture-ddd.mdc` | Layer boundaries — always on |
| `.cursor/rules/security-hackathon.mdc` | Rules-first auth, no secrets in client |
| `.cursor/rules/react-components.mdc` | TS/TSX component patterns |
| `.cursor/skills/hackathon-clean-architecture/SKILL.md` | Firebase features, refactors, voting |

---

## Architecture (do)

- **Presentation:** `app/**`, `components/**` — UI only; call `lib/<domain>.ts` or hooks.
- **Application / domain:** `lib/*.ts` — one bounded context per file (`admin-users`, `join-requests`, `voting`, …).
- **Types:** `types/**` — shared shapes; avoid duplicating Firestore maps in components.
- **Configuration:** `lib/constants.ts`, `lib/hackathon-collections.ts` — collection names and env; never hardcode `io2026Hackathon_*` in new UI copy.
- **Privileged writes:** Cloud Functions (`functions/src/`) + HTTPS callables — admin provision, roles, votes, `place`, `voteTotal`.
- **Reusable admin UI:** `components/admin/*` (e.g. `AdminUserBadges`, `AdminProvisionUserDialog`, `AdminUserEditDialog`).
- **Firestore reads in pages:** when touching admin/list screens, prefer `lib/` helpers (e.g. `listUsersForAdmin()`) over inline `getDocs` in `page.tsx`.
- **Security rules** are authoritative; client checks are UX only.

## Architecture (don’t)

- Don’t add **new** `firebase/firestore` or `firebase/storage` imports under `components/**`.
- Don’t put business rules (vote caps, role checks, participation logic) only in React — enforce in Functions or rules.
- Don’t drive-by migrate every legacy page that still uses the client SDK; migrate the file you’re editing.
- Don’t create generic `utils.ts` dumps — name modules after use-cases.
- Don’t expose **collection paths**, **bucket paths**, **API keys**, or **service account JSON** in UI text, toasts, logs, or public README content.

---

## Security (do)

- Keep secrets in **`.env.local`** / Vercel env — never commit `.env`, `.env.local`, or `*serviceAccount*.json`.
- Use **`NEXT_PUBLIC_*` only** for values safe in the browser (Firebase web config, public hackathon ids).
- **Admin actions** via callables with `assertAdmin` (`adminProvisionHackathonUser`, `setUserRole`, `adminUpdateUser`, …).
- **Votes:** client cannot create vote docs; use `castVotes` only.
- **Projects:** clients cannot set `place` or `voteTotal` (rules). Creates/updates must include **`hackathonId`**; use `lib/project-submissions.ts` (`stampProjectOwnership`, `saveProjectDocument`).
- **Roles:** clients cannot elevate `role` on other users; admins use Functions.
- Validate and trim strings on server paths; cap lengths where applicable.
- Gate admin UI with `ProtectedRoute` + server/rules — hiding routes is not enough.

## Security (don’t)

- Don’t log tokens, passwords, or full PII in production paths.
- Don’t return internal collection names from callables to the client (e.g. provision result = `{ success, userId, email }` only).
- Don’t `dangerouslySetInnerHTML` without sanitization.
- Don’t build storage paths solely from unvalidated user input.
- Don’t use `--no-verify` or weaken hooks/scripts for convenience.
- Don’t document real env **values** in markdown — names and placeholders only.

---

## Admin: provision user by email

| Piece | Location |
|-------|----------|
| UI | `/admin/users` → **Add user to hackathon** → `AdminProvisionUserDialog` |
| Client API | `lib/admin-users.ts` → `provisionHackathonUserByEmail()` |
| Server | `adminProvisionHackathonUser` callable |
| List/filter | `listUsersForAdmin`, `filterAdminUsers`, `sortAdminUsers` |

Provisioned profile fields: `adminProvisioned`, `profileStatus: "provisioned"`, `provisionedBy`, `provisionedAt`, audit `createdBy` / `updatedBy` / `createdDate` / `updatedDate`. On first sign-in, `ensureUserProfile` sets `profileStatus: "active"`.

**Requires:** Firebase Auth account for that email (user must have signed in once).

Deploy: `firebase deploy --only functions:adminProvisionHackathonUser,functions:ensureUserProfile`

---

## Voting (must follow)

- **Organisers** (`admin` / `moderator`): **10** votes total, **max 2** per project.
- **Participants**: **5** votes total, **max 2** per project.
- **Check-in required** before `castVotes` (`io2026Hackathon_attendance/{uid}.attendanceVerified`).
- **`fetchUserVotes`:** composite query with fallback (index may be building in prod).
- Winners via `voteTotal` + admin `assignWinnersFromVotes` or manual `place`.
- Attendee badges: `components/attendance/AttendeeEventBadges.tsx` on `/vote`.

## Event gallery (photos & videos)

| Action | API / route |
|--------|-------------|
| Public browse | `/hackathon/photos` — `fetchApprovedEventPhotos()` |
| Attendee multi-upload | `uploadAttendeeEventPhoto()` → `reserveEventPhotoUpload`, Storage, `finalizeEventPhotoUpload` |
| Admin upload | `uploadEventPhoto(..., { publishImmediately: true })` |
| Moderate | `/admin/photos` — approve, bulk approve, remove (`withdrawEventPhoto`) |
| Reorder / rename | `EventPhotoGalleryEditor` — `saveEventPhotoSortOrders`, `updateEventPhotoMetadata` (`title`) |

**Quota:** `MAX_EVENT_PHOTOS_PER_ATTENDEE = 10` (pending + approved). Attendees cannot `create` Firestore docs directly — callables only.

Deploy callables with codebase prefix: `functions:hackathon:reserveEventPhotoUpload`, etc.

## Check-in desk (organisers)

| Action | API |
|--------|-----|
| Self check-in | `POST /api/me/attendance/self-check-in` |
| Staff check-in | `staffCheckInUser` |
| Swag | `setAttendeeSwag` |
| AI DevCamp 2026 tag | `tagAttendeeAidevcamp2026` or `staffCheckInUser({ cohort: "aidevcamp2026" })` |
| Reset (admin) | `resetUserAttendance` |

UI: `components/checkin/StaffAttendeeCheckIn.tsx` at `/checkin`. Cohort values: `aidevcamp2026` (legacy `aidevcamp_flat` still recognized for badges).

## Env (typical `.env.local`)

```bash
NEXT_PUBLIC_HACKATHON_DATASET=io2026
NEXT_PUBLIC_ACTIVE_HACKATHON_ID=io2026Hackathon
# NEXT_PUBLIC_FIREBASE_* from Firebase Console — never commit values
```

Functions: copy `functions/.env.example` for deploy-time collection env vars.

## Deploy checklist

1. `firebase deploy --only firestore:rules,firestore:indexes`
2. `firebase deploy --only functions` (include `ensureUserProfile`, `adminProvisionHackathonUser`)
3. Vercel: set `NEXT_PUBLIC_*` in dashboard; redeploy
4. Admin: `/admin/hackathons`, `/admin/content`, `/admin/live` → refresh stats before event
