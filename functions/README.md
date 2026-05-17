# Hackathon Cloud Functions (gen-2)

Codebase: **`hackathon`** (see `firebase.json`).

Callable names are listed in [`lib/cloud-functions.ts`](../lib/cloud-functions.ts). After adding or renaming a function:

1. Export it from `src/index.ts`
2. Add the name to `HACKATHON_CALLABLES` in `lib/cloud-functions.ts`
3. Run `npm run functions:check` from the repo root

## Deploy

```bash
# Hackathon only (recommended for day-to-day)
npm run functions:deploy:hackathon

# Photobooth gen-1 handlers (separate codebase)
npm run functions:deploy:legacy

# Both codebases
npm run functions:deploy
```

Gen-1 photobooth functions live in [`functions-legacy/`](../functions-legacy/).
