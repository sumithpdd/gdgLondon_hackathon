# Updates & Changelog

GDG London Hackathon platform — IO 2026 live dataset + IWD archive.

---

## May 2026 (recent)

### Project submissions
- **Save progress** and **Ship it!** write to `io2026Hackathon_projects` via `lib/project-submissions.ts`
- Every project doc stamped with **`userId`**, **`userEmail`**, **`hackathonId`**, **`hackathonName`**
- Canonical UX on **`/hackathon/my-projects`** (profile page is directory-only)
- Firestore rules require `hackathonId` on project create/update
- Cloud Function `createProject` is fallback only; Functions default collection names aligned to `io2026Hackathon_*`

### Check-in & event desk
- Single **`/checkin`** page: self-service code + organiser desk
- Self check-in via **`POST /api/me/attendance/self-check-in`**
- Organiser desk: **swag** toggle, **AI DevCamp 2026** cohort tag, filters (needs swag / AI DevCamp / not checked in)
- `tagAttendeeAidevcamp2026()` in `lib/check-in.ts` for one-tap cohort on checked-in users
- `/admin/checkin` redirects to `/checkin`; admin nav → **Operations → Check-in desk**

### Voting
- **`/vote`** — search, budget bar, resilient load (`fetchUserVotes` index fallback)
- **`AttendeeEventBadges`** on vote page — AI DevCamp 2026 + swag received
- Ballot errors no longer block project list load
- Deploy **`firestore.indexes.json`** for vote queries in production

### Admin UX
- Grouped admin nav (`lib/admin-nav.ts`): Overview, People, Content, Event, Operations
- **`/admin/projects`** — all draft + submitted projects with full detail

### Auth & ops
- Google sign-in: redirect fallback for mobile/iOS
- Client error logging → `error_logs`; admin viewer at **`/admin/errors`**
- Firebase Admin env normalization for Vercel (`FIREBASE_ADMIN_*`)

See [USER_FLOW.md](./USER_FLOW.md) and [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) for full journeys.

---

## Current data model (IO 2026)

When `NEXT_PUBLIC_HACKATHON_DATASET=io2026`:

| Collection | Purpose |
|------------|---------|
| `io2026Hackathon_users` | Profiles and roles |
| `io2026Hackathon_projects` | Drafts and submissions |
| `io2026Hackathon_joinRequests` | Team join requests |
| `io2026Hackathon_attendance` | Event check-in |
| `io2026Hackathon_votes` | Audience votes (Function writes only) |
| `io2026Hackathon_settings` | Prizes, voting window, rules |
| `error_logs` | App errors (server/API only) |

**Archive:** `iwd2026Hackathon_*` — read-only in client rules; `/past-projects`.

Legacy `hackaton*` collections remain until migrated.

See [DATA_MODEL.md](./DATA_MODEL.md) for full schema.

---

## Migration from legacy (`hackaton*`)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run migrate:iwd-archive
# Dry run: node scripts/migrate-to-iwd-archive.mjs --dry-run
```

Copies legacy data to `iwd2026Hackathon_*` for `/past-projects`. Does not delete `hackaton*`.

---

## Related docs

- [USER_FLOW.md](./USER_FLOW.md) — participant journey
- [DEPLOYMENT.md](./DEPLOYMENT.md) — deploy checklist
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common fixes
