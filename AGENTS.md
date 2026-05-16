# Agent / contributor notes

## Product

**GDG London Hackathon** — multi-edition platform. Admins manage registry, prizes, voting windows, and users; participants sign in, profile, submit projects tagged with `hackathonId`, check in, and vote. Current live dataset: **IO 2026** (`io2026Hackathon_*` when `NEXT_PUBLIC_HACKATHON_DATASET=io2026`).

## Architecture & boundaries

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — DDD-leaning `lib/` modules, thin React layers, Firebase access conventions.
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — collections, participation, votes, projects.
- [docs/USER_FLOW.md](docs/USER_FLOW.md) — auth, register, voting, admin.
- [docs/IO2026_HACKATHON_SPEC.md](docs/IO2026_HACKATHON_SPEC.md) — canonical spec (routes, voting §8).

## Cursor guidance

| Resource | Use |
|----------|-----|
| `.cursor/rules/architecture-ddd.mdc` | Layer boundaries, no new raw Firestore in components |
| `.cursor/rules/security-hackathon.mdc` | Rules-first auth, secrets, vote/project field protection |
| `.cursor/rules/react-components.mdc` | TS/TSX component patterns |
| `.cursor/skills/hackathon-clean-architecture/SKILL.md` | Refactors, Firebase features, **voting caps & security** |

## Voting (must follow)

- **Organisers** (`admin` / `moderator`): **10** votes total, **max 2** per project.
- **Participants**: **5** votes total, **max 2** per project.
- **Check-in required** before `castVotes`.
- **Winner by total votes** — `voteTotal` on projects; admin assigns `first`/`second`/`third` via `/admin/voting` or manual dashboard.
- **Judging lenses** (for voters): Uniqueness, Completeness, Fresh idea, Use of AI — in rules UI + `settings/main.judgingCriteria`.

## Env (typical `.env.local`)

```bash
NEXT_PUBLIC_HACKATHON_DATASET=io2026
NEXT_PUBLIC_ACTIVE_HACKATHON_ID=io2026Hackathon
```

Functions (deploy): copy `functions/.env.example` → set `PROJECTS_COLLECTION`, `VOTES_COLLECTION`, `ATTENDANCE_COLLECTION`, `ACTIVE_HACKATHON_ID`.

## Live projector & content CMS

- **`/live`** — subscribes to `liveStats/summary` + `settings/liveSlide` (no writes).
- **`/admin/live`** — slide mode, refresh aggregates (`refreshLiveStats` callable).
- **`/admin/content`** — edit `resourcesIntro`, `resourceLinks`, `rulesSections` on `settings/main`.

## Deploy checklist

1. `firebase deploy --only firestore:rules,firestore:indexes`
2. `firebase deploy --only functions` (`castVotes`, `assignWinnersFromVotes`, `refreshLiveStats`)
3. `npm run seed:io2026 -- --uid=... --with-registry --force-settings` (prizes, judging criteria, resources, rules, `liveSlide`)
4. Open **`/admin/live`** → **Refresh stats** once before event; cast votes to keep leaderboard live.
