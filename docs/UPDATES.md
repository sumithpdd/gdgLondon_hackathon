# Updates & Changelog

Build with AI Hackathon — IWD London 2026

---

## Current Data Model (March 2026)

**Collections**:
- `hackatonUsers` — User profiles and roles (admin, moderator, user)
- `hackatonProjects` — Hackathon project submissions
- `Interests`, `Expertise`, `TechStack` — Tag libraries

**Storage**: `hackathon_uploads/` — Project screenshots

See [DATA_MODEL.md](./DATA_MODEL.md) for full schema.

---

## Migration from Legacy (DevFestComp2025 / CompetitionUsers)

If migrating from the previous DevFest setup:

1. **Firestore**: Create new `projects` and `users` collections
2. **Export** data from `DevFestComp2025` → import to `projects`
3. **Export** data from `CompetitionUsers` → import to `users`
4. **Storage**: Copy files from `devfest2025Comp/` to `hackathon_uploads/`
5. Update Firebase security rules (see `firebase-rules.txt`)
6. Deploy updated app

---

## Recent Changes

- **Collections**: `projects`, `users` (replacing DevFestComp2025, CompetitionUsers)
- **Storage**: `hackathon_uploads` (replacing devfest2025Comp)
- **Constants**: `PROJECTS_COLLECTION`, `USERS_COLLECTION` in `lib/constants.ts`
