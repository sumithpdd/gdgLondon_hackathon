---
name: hackathon-clean-architecture
description: Guides refactors and new features toward DDD-style modules, thin React components, and safer Firebase boundaries for the GDG London hackathon Next.js app. Use when adding Firestore/Storage access, moving logic out of components, reviewing security, or when the user mentions clean architecture, domain layer, repositories, or Cloud Functions.
---

# Hackathon clean architecture & security

## Goals

- **Component-based UI** in `app/` and `components/` with minimal business logic.
- **Domain-oriented modules** in `lib/` as the default place for orchestration, queries, and mutations that talk to Firebase.
- **No direct DB/storage from new presentation code** — add or extend `lib/<context>.ts`, Route Handlers (`app/api/**`), or **HTTPS Callable** functions for sensitive writes.
- **Security rules** remain authoritative; client checks are UX only.

## Platform model (GDG London Hackathon)

| Layer | Purpose |
|-------|---------|
| `hackathons/{id}` | Registry metadata (display name, slug, `dataCollectionKey`) — admin CRUD at `/admin/hackathons` |
| `NEXT_PUBLIC_ACTIVE_HACKATHON_ID` | Logical edition id on user docs: `hackathonParticipations.{id}` |
| `NEXT_PUBLIC_HACKATHON_DATASET` | Which Firestore prefix is live (`io2026` → `io2026Hackathon_*`) |
| Project `hackathonId` | Tags each project to an edition (set on create via `createProject` + form) |

**One live dataset at a time** via env; registry does not auto-switch collections per request yet.

## Bounded contexts (`lib/`)

| Module | Responsibility |
|--------|----------------|
| `active-hackathon.ts` | `getActiveHackathonId()` |
| `participation.ts` | Record `hackathonParticipations` on sign-in |
| `hackathons-registry.ts` | Global hackathon registry CRUD |
| `prizes.ts` / `hackathon-settings.ts` | Settings doc: prizes, voting windows, judging criteria |
| `voting.ts` | Vote UI helpers; **writes via `castVotes` callable only** |
| `attendance.ts` | Check-in docs (`attendanceVerified`) |
| `auth.ts` | Profile types, `getUserProfile`, sign-in hooks |
| `admin-users.ts` | `listUsersForAdmin`, filter/sort, provision-by-email, admin callables |
| `user-profile-sync.ts` | Sign-in → active users collection + legacy migration |
| `join-requests.ts`, `buddies.ts`, … | Other use-cases |

## Voting (authoritative server rules)

Implemented in Cloud Functions — **never trust client caps**.

| Role | Vote budget | Max per project |
|------|-------------|-----------------|
| `admin` or `moderator` (organiser) | 10 | 2 |
| `user` (participant) | 5 | 2 |

- Requires **check-in** (`io2026Hackathon_attendance/{uid}`, `attendanceVerified`).
- Respects `settings/main`: `votingOpensAt`, `votingClosesAt`, `winnersAnnounced`.
- Updates `project.voteTotal` and docs in `io2026Hackathon_votes` (client **cannot** create votes — rules `allow create: if false`).
- Winners: admin **`assignWinnersFromVotes`** (top 3 by `voteTotal`) or manual `place` on dashboard.
- UI: `/vote`, admin `/admin/voting`.

## When adding a feature

1. Identify the **bounded context** (e.g. projects, buddies, voting).
2. If Firestore/Storage is needed: add functions to an existing `lib` module or create `lib/<context>.ts` with typed inputs/outputs.
3. Keep **pages thin**: call lib functions or hooks that wrap them.
4. For **cross-user, caps, or aggregates** (votes, places, join approve): **Cloud Functions** + callable from the client.

## React checklist

- `"use client"` only where needed.
- Forms: controlled inputs, explicit submit handlers, accessible labels.
- Import collection names from `lib/constants.ts` / `lib/hackathon-collections.ts` — do not hardcode `io2026Hackathon_*` in components.

## Security checklist

- No secrets in client bundles; `NEXT_PUBLIC_*` only for non-secret config.
- **Votes:** client read own ballots + admin audit; writes **only** via `castVotes` (Admin SDK in Functions).
- **Projects:** clients cannot set `place` or `voteTotal` (Firestore rules).
- **Roles:** clients cannot elevate `role`; admin actions use `assertAdmin` in Functions or rules `isAdmin()`.
- **Admin provision:** `adminProvisionHackathonUser` only; do not expose collection names in UI/toasts; callable returns `{ success, userId, email, created }` only.
- **Admin UI:** reusable `components/admin/*`; Firestore list reads via `lib/admin-users.ts`, not new inline `getDocs` in components.
- Storage: fixed folder prefixes; validate upload size/type.
- Do not commit `.env`, service accounts, or log tokens/PII.

## Legacy note

Many files still import `firebase/firestore` in `app/` or `components/`. When editing, move **new** logic to `lib/`; avoid mass migration without scope.

## Docs to keep in sync

- `docs/IO2026_HACKATHON_SPEC.md` — product + routes + voting §8
- `docs/DATA_MODEL.md` — collections, vote shape, `hackathonId`
- `docs/ARCHITECTURE.md`, `AGENTS.md`
- Deploy: `firestore.rules`, `firestore.indexes.json`, Functions env (`functions/.env.example`)
