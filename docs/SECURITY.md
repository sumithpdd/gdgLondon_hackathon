# Security Guidelines

Build with AI Hackathon — IWD London 2026

---

## Documentation Security

To reduce attack surface and prevent targeted exploitation:

### Do NOT include in public documentation

- Actual Firestore collection names
- Actual storage bucket paths or folder names
- API keys, secrets, or credential values
- Environment variable values (use placeholders)
- Internal identifiers or naming conventions that could aid enumeration

### Use instead

- Generic descriptors: "users collection", "projects collection"
- References: "See lib/constants.ts for configuration"
- Placeholders for values: `[YOUR_API_KEY]`, `[PROJECT_ID]`
- High-level descriptions without implementation details

---

## Deployment

- Keep `firebase-rules.txt` and `.env.example` in version control
- Never commit `.env.local` or any file containing real keys
- Use environment variables for all sensitive configuration
- Rotate keys if they are ever exposed

---

## Firestore Rules

Deploy rules from `firebase-rules.txt` via Firebase Console. The rules file contains the actual collection paths required for Firebase to function; keep it out of public-facing documentation and do not link to it from public sites.
