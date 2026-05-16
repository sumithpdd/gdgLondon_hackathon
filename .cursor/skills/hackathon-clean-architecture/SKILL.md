---
name: hackathon-clean-architecture
description: Guides refactors and new features toward DDD-style modules, thin React components, and safer Firebase boundaries for the GDG London hackathon Next.js app. Use when adding Firestore/Storage access, moving logic out of components, reviewing security, or when the user mentions clean architecture, domain layer, repositories, or Cloud Functions.
---

# Hackathon clean architecture & security

## Goals

- **Component-based UI** in `app/` and `components/` with minimal business logic.
- **Domain-oriented modules** in `lib/` as the default place for orchestration, queries, and mutations that talk to Firebase.
- **No direct DB/storage from new presentation code** — add or extend `lib/<context>.ts`, Route Handlers (`app/api/**`), or **HTTPS Callable** functions for sensitive writes (pattern already used for `createProject`).
- **Security rules** remain authoritative; client code must not assume obscurity.

## When adding a feature

1. Identify the **bounded context** (e.g. projects, buddies, join-requests).
2. If Firestore/Storage is needed: add functions to an existing `lib` module or create `lib/<context>.ts` with typed inputs/outputs.
3. Keep **pages thin**: call lib functions or hooks that wrap them; avoid 200+ line components unless unavoidable in one PR.
4. For **cross-user or privileged** operations, prefer **Cloud Functions** + callable from the client instead of widening client rules.

## React checklist

- `"use client"` only where needed; prefer server components for static/read-mostly routes.
- Forms: controlled inputs, explicit submit handlers, accessible labels.
- Avoid duplicating **constants** — import from `lib/constants.ts` / `lib/hackathon-collections.ts`.

## Security checklist

- No secrets in client bundles; env via `process.env` / `NEXT_PUBLIC_*` per Next conventions.
- Validate IDs and ownership before updates (rules + app checks).
- Storage uploads: fixed folder prefixes from constants; avoid arbitrary path segments from users.

## Legacy note

Many existing files import `firebase/firestore` directly in `app/` or `components/`. **Do not** mass-rewrite without scope; when editing a file, consider moving new logic to `lib/` and leave mechanical migration for a dedicated task.
