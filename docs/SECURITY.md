# Security Guidelines

GDG London Hackathon — Firebase + Next.js

---

## Priority order

1. **Firestore / Storage security rules** — real authorization.
2. **Cloud Functions (Admin SDK)** — cross-user writes, caps, aggregates, admin provision.
3. **Client** — UX only; never the sole gate for admin, votes, or role changes.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [AGENTS.md](../AGENTS.md), `.cursor/rules/security-hackathon.mdc`.

---

## Secrets and environment variables

### Do

- Store secrets in **`.env.local`** (local) and **Vercel environment variables** (production).
- Use **`NEXT_PUBLIC_*`** only for values that are safe in the browser (Firebase web SDK config, public hackathon edition id).
- Copy from **`.env.example`** — document **names** only in markdown, never real values.
- Add `*.json` service accounts and `.env.local` to **`.gitignore`** (already configured).
- Rotate Firebase keys if exposure is suspected.

### Don’t

- Commit `.env`, `.env.local`, service account JSON, or private keys.
- Hardcode API keys or project secrets in source.
- Share keys in chat, email, or screenshots.
- Log auth tokens, passwords, or unnecessary PII.
- Return internal collection names from HTTPS callables to the client.

---

## Application layers

| Layer | May access | Must not |
|-------|------------|----------|
| `components/**` | Props, hooks, `lib/*` | New direct Firestore/Storage imports |
| `app/**` pages | `lib/*`, auth context | Embed domain rules; leak DB paths in UI |
| `lib/**` | Firestore client SDK, callables | Ship server-only secrets |
| `functions/**` | Admin SDK, env | Trust client payloads without validation |

Collection names live in **`lib/constants.ts`** and **`lib/hackathon-collections.ts`** — not in user-visible strings.

---

## Documentation hygiene

### Public-facing (marketing, external README snippets)

- Use generic terms: “users collection”, “projects collection”.
- Placeholders: `[YOUR_API_KEY]`, `[PROJECT_ID]`.
- Point implementers to `.env.example` and Firebase Console.

### Internal contributor docs (`docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`)

- May list actual collection prefixes for this repo (`io2026Hackathon_*`, legacy `hackaton*`).
- Still **no real secret values**.
- Do not copy internal collection tables into public sites.

### Rules files

- `firestore.rules` / `storage.rules` in the repo contain paths required by Firebase.
- Deploy via `firebase deploy --only firestore:rules` — do not publish rules contents as marketing material.

---

## Feature-specific rules

| Feature | Rule |
|---------|------|
| **Votes** | Client `create` denied on vote collection; use `castVotes` callable only |
| **Projects** | Clients cannot set `place` or `voteTotal` |
| **Roles** | Clients cannot change another user’s `role`; use `setUserRole` / rules `isAdmin()` |
| **Admin provision** | `adminProvisionHackathonUser` — admin-only; resolves uid via Auth email |
| **Storage** | Fixed folder prefix; validate uploads; align paths with storage rules |
| **HTML** | No unsanitized `dangerouslySetInnerHTML` |

---

## Deployment

- Deploy rules before relying on new client features: `firebase deploy --only firestore:rules,firestore:indexes`
- Deploy functions after changing callables: `firebase deploy --only functions`
- Never commit production `.env` files

---

## Related

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [FIRESTORE_RULES.md](./FIRESTORE_RULES.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
