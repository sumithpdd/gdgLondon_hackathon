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

- **Canonical UX:** project draft/final submission lives on **`/hackathon/my-projects`** (form below your project card). Hackathon profile (directory, buddies) stays on **`/hackathon/profile`** — not merged into the submission payload.
- **`/submit`** redirects to **`/hackathon/my-projects?project=1`** (and preserves `edit=` when present). Old links remain valid.

---

## Multi-hackathon & domain modules

| Module | Role |
|--------|------|
| `lib/hackathon-collections.ts` | `io2026` vs legacy vs `iwd2026` archive collection names |
| `lib/hackathons-registry.ts` | CRUD for global `hackathons` registry |
| `lib/active-hackathon.ts` | `getActiveHackathonId()` from env |
| `lib/participation.ts` | `hackathonParticipations` on user sign-in |
| `lib/prizes.ts` | Read/seed prize array on `settings/main` |
| `components/HackathonAuthShell.tsx` | Sign-in modal + `?login=1` query handling |
| `components/HackathonResultsSummary.tsx` | Winners + stats (admin + `/past-projects`) |

**Auth UX:** `/register` (sign up), `AuthModal` (sign in / reset), pattern aligned with AI DevCamp Build withAI.

**Resources + rules:** single page `/hackathon/resources`; `/hackathon/rules` redirects to `#rules`.

---


## Security (summary)

- Never commit **`.env.local`**, service accounts, or API secrets.
- **Do not** trust client-only checks for admin or moderation; mirror constraints in rules or Functions.
- See **[SECURITY.md](./SECURITY.md)** for documentation hygiene and **[FIRESTORE_RULES.md](./FIRESTORE_RULES.md)** for rules.

---

## Cursor assistant

- **Rules:** `.cursor/rules/*.mdc` — always-on architecture + security; React/TS rules when matching files are open.
- **Skill:** `.cursor/skills/hackathon-clean-architecture/` — deeper checklist for refactors and new Firebase features.
- **Agent entry:** [AGENTS.md](../AGENTS.md) at repo root.

---

## Related docs

- [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) — collections, routes, timelines.
- [USER_FLOW.md](./USER_FLOW.md) — participant journey including profile + submission.
