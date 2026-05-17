# Architecture & engineering conventions

This project is a **Next.js 14 (App Router)** app with **Firebase Auth, Firestore, and Storage**. These conventions describe how we structure code today and where we are heading.

---

## High-level shape

| Layer | Location | Responsibility |
|--------|----------|----------------|
| **Presentation** | `app/`, `components/` | Routes, layout, UI composition, local UI state, calls into `lib/` or auth context. |
| **Application / domain services** | `lib/*.ts` | Use-cases: queries, command-style functions, mapping to/from Firestore, HTTPS callable wrappers. |
| **Configuration** | `lib/constants.ts`, `lib/hackathon-collections.ts`, `lib/active-hackathon.ts`, `lib/firebase.ts` | Env-driven collection names, active hackathon id, deadlines, Firebase app instance. |
| **Types** | `types/` | Shared TypeScript models (e.g. IO 2026 shapes). |
| **Privileged / cross-user logic** | `functions/src/` | Cloud Functions, Admin SDK, enforcement (e.g. one project per user). |

We follow a **component-based** front end with **domain-driven** naming: modules align with **capabilities** (buddies, join-requests, attendance) rather than generic “helpers.”

---

## Data access policy

**Target (new and refactored code)**

- **Do not** add new `firebase/firestore` or `firebase/storage` imports under `components/**`.
- Prefer **`lib/<domain>.ts`** for reads/writes, or **HTTPS Callable** / **Route Handlers** for operations that need extra validation or must not trust the client alone.
- **Firestore and Storage security rules** are the source of truth for authorization.

**Current state (legacy)**

- Several `app/**` pages and some components still use the Firebase **client SDK** directly. That is allowed behind rules until migrated. When you touch a file, consider moving new or extracted logic into `lib/` without ballooning the PR scope.

---

## Project submission & profile

- **Canonical UX:** project draft/final submission lives on **`/hackathon/my-projects`** (form below your project card). Buttons: **Save progress** (`draft`) and **Ship it! — Final submission** (`submitted`).
- **Writes:** `lib/project-submissions.ts` — `saveProjectDocument` stamps **`userId`**, **`userEmail`**, **`hackathonId`**, **`hackathonName`** on every create/update; primary path is client `addDoc`/`updateDoc` on `PROJECTS_COLLECTION` (`io2026Hackathon_projects` when dataset=io2026). Callable **`createProject`** is fallback only.
- **Profile:** `/hackathon/profile` — directory, buddies, team-join fields only; not the project form.
- **`/submit`** redirects to **`/hackathon/my-projects?project=1`** (and preserves `edit=` when present).

---

## Multi-hackathon & domain modules

| Module | Role |
|--------|------|
| `lib/hackathon-collections.ts` | `io2026` vs legacy vs `iwd2026` archive collection names |
| `lib/hackathons-registry.ts` | CRUD for global `hackathons` registry |
| `lib/active-hackathon.ts` | `getActiveHackathonId()`, event description from `hackathons` registry |
| `lib/participation.ts` | `hackathonParticipations` on user sign-in |
| `lib/admin-users.ts` | Admin user list/filter, provision-by-email, edit/soft-delete via Cloud Functions |
| `components/admin/AdminUserBadges.tsx` | Reusable role + status badges for admin user UI |
| `components/admin/AdminProvisionUserDialog.tsx` | Add Auth user to active hackathon (callable) |
| `lib/hackathon-projects.ts` | Filter projects by active `hackathonId` (ideas gallery) |
| `lib/project-submissions.ts` | Save/load projects; stamp ownership; `saveProjectDocument` |
| `lib/profile-completion.ts` | Team join score (80% threshold) |
| `lib/meApi.ts` | Self check-in + check-in status API wrappers |
| `lib/clientErrorLogger.ts` | Client-side errors → `POST /api/log-error` |
| `lib/error-logs-admin.ts` | Admin fetch of `error_logs` |
| `lib/prizes.ts` | Read/seed prize array on `settings/main` |
| `components/HackathonAuthShell.tsx` | Sign-in modal + `?login=1` query handling |
| `components/HackathonResultsSummary.tsx` | Winners + stats (admin + `/past-projects`) |

**Auth UX:** `/register` (sign up), `AuthModal` (sign in / reset), pattern aligned with AI DevCamp Build withAI.

**Resources + rules:** single page `/hackathon/resources`; `/hackathon/rules` redirects to `#rules`.

---


## Component-based admin pattern

Admin screens should stay thin:

1. **Page** (`app/admin/users/page.tsx`) — layout, filters state, pagination.
2. **`lib/admin-users.ts`** — `listUsersForAdmin`, `filterAdminUsers`, `sortAdminUsers`, callable wrappers.
3. **`components/admin/*`** — dialogs and presentational badges; no Firestore imports in new admin components.

Do not show raw Firestore collection names in user-facing copy; use edition labels (`getActiveHackathonId()`) or generic “hackathon profile”.

---

## Security (summary)

- Never commit **`.env.local`**, service accounts, or API secrets.
- **Do not** trust client-only checks for admin or moderation; mirror constraints in rules or Functions.
- **Do not** leak collection paths or keys in UI, logs, or public docs — see **[SECURITY.md](./SECURITY.md)**.
- Internal schema detail: **[DATA_MODEL.md](./DATA_MODEL.md)** (contributors only).
- Rules reference: **[FIRESTORE_RULES.md](./FIRESTORE_RULES.md)** and repo `firestore.rules`.

---

## Cursor assistant

- **Rules:** `.cursor/rules/*.mdc` — always-on architecture + security; React/TS rules when matching files are open.
- **Skill:** `.cursor/skills/hackathon-clean-architecture/` — deeper checklist for refactors and new Firebase features.
- **Agent entry:** [AGENTS.md](../AGENTS.md) at repo root.

---

## Cloud Functions (privileged)

| Callable / API | Purpose |
|----------------|---------|
| `saveProjectDocument` (client `lib/`) | Primary create/update in `PROJECTS_COLLECTION` with `hackathonId` + `userId` |
| `createProject` | Fallback create if client `addDoc` fails; must use same collection env as app |
| `POST /api/me/attendance/self-check-in` | Self check-in with code + window validation |
| `POST /api/log-error` | Persist client errors to `error_logs` |
| `GET /api/admin/error-logs` | Admin error log list |
| `castVotes` | Audience voting with caps + check-in |
| `setWinnerPlace` / `assignWinnersFromVotes` | Winner assignment |
| `deleteProject` | Admin delete project + join requests |
| `setUserRole` | Admin role on all user collections |
| `adminUpdateUser` | Admin profile field updates |
| `adminSetUserDeleted` | Soft delete / restore user |
| `adminProvisionHackathonUser` | Admin: add Auth user to active hackathon users + audit fields |
| `ensureUserProfile` | Sign-in: ensure `io2026Hackathon_users` doc; activate provisioned profiles |

Deploy: `firebase deploy --only functions`

---

## Related docs

- [JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md) — **start here for new developers**
- [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) — collections, routes, timelines.
- [USER_FLOW.md](./USER_FLOW.md) — participant journey including profile + submission.
