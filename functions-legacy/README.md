# Legacy (gen-1) Cloud Functions

These functions belong to the **photobooth / DevFest** app on the same Firebase project (`devfestlondon-88398`). They are **not** used by the hackathon Next.js app.

| Function | Trigger |
|----------|---------|
| `healthCheck` | HTTPS |
| `sendEmail` | Callable |
| `seedBackgrounds` | Callable |
| `processPhotoWithGemini` | Callable (2GB) |
| `cleanupPhotoStorage` | Firestore `photobooth/{docId}` onDelete |

## Deploy

```bash
npm run functions:deploy:legacy
# or deploy everything (hackathon + legacy):
npm run functions:deploy
```

Deploy **hackathon only** (does not touch legacy):

```bash
npm run functions:deploy:hackathon
```

## Syncing real photobooth source

If you have the original photobooth repo, copy its gen-1 handlers into `src/index.ts` (keep export names identical), then run `npm run functions:deploy:legacy`.

`processPhotoWithGemini` currently throws until real Gemini logic is restored.
