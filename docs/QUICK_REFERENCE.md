# 📖 Quick Reference Guide

> **One-page guide to find everything you need**

**New to the repo?** → **[JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md)** (flows, schema, repo map, common pitfalls).

---

## 🎯 I Want To...

### Deploy the Application
**→ [DEPLOYMENT.md](./DEPLOYMENT.md)**
- 5-minute quick start
- Complete deployment steps
- Vercel + Firebase setup
- Environment variables
- Troubleshooting

### Understand Authentication
**→ [FIREBASE_AUTH.md](./FIREBASE_AUTH.md)**
- Email/Password authentication
- Google OAuth
- User profile management
- Role-based access
- Security implementation

### Configure Security Rules
**→ [FIRESTORE_RULES.md](./FIRESTORE_RULES.md)**
- Complete Firestore rules
- Storage rules
- Rule explanations
- Security best practices
- Testing rules

### IO 2026, multi-hackathon, Buddies & routes
**→ [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md)** — `NEXT_PUBLIC_HACKATHON_DATASET`, `hackathons` registry, `hackathonParticipations`, prizes in settings, `npm run migrate:iwd-archive`, `/past-projects` (winners + stats), Buddies, auth (`/register`, `?login=1`). **Data model:** [DATA_MODEL.md](./DATA_MODEL.md). **User flow:** [USER_FLOW.md](./USER_FLOW.md).

### Event day: check-in, swag, voting
**→ [USER_FLOW.md](./USER_FLOW.md#step-4-event-day--check-in-swag-ai-devcamp-voting)** — customer journey diagram  
**→ [DATA_MODEL.md](./DATA_MODEL.md#event-attendance--swag)** — attendance + cohort + swag schema  
**Organiser desk:** `/checkin` · **Vote:** `/vote` · **Admin:** `/admin/voting`, Operations → Check-in desk

### Learn About Mentorship Program
- Mentee applications
- Mentor applications
- Tag system
- Resume uploads
- Application tracking

### Start as a Beginner
**→ [START_HERE.md](./START_HERE.md)**
- Technology overview
- Setup instructions
- First steps
- Learning resources

### Fix an Error
**→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
- Common issues
- Error messages
- Solutions
- Debug tips

---

## 📚 All Documentation

### Setup & Getting Started
- [START_HERE.md](./START_HERE.md) - Beginner's guide
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Technical setup
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Environment setup

### Deployment
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide ⭐
- [CHECKLIST.md](./CHECKLIST.md) - Pre-deployment checklist

### Features & Flow
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Layers, DDD-style `lib/` modules, `lib/project-submissions.ts`, Cursor rules ⭐
- [USER_FLOW.md](./USER_FLOW.md) - User journey (auth → profile / my-projects save & ship → ideas → check-in → vote) ⭐
- [FEATURES.md](./FEATURES.md) - Complete feature list (technical)
- [FEATURES_SIMPLE.md](./FEATURES_SIMPLE.md) - Simple explanations

### Authentication & Security
- [FIREBASE_AUTH.md](./FIREBASE_AUTH.md) - Auth implementation ⭐
- [FIRESTORE_RULES.md](./FIRESTORE_RULES.md) - Security rules ⭐
- [SECURITY.md](./SECURITY.md) - Security guidelines

### Admin
- [DEPLOYMENT.md](./DEPLOYMENT.md) Step 4 - Admin setup (Firestore users)

### Troubleshooting & Fixes
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase rules and upload fixes

### Reference
- [README.md](./README.md) - Documentation index
- [UPDATES.md](./UPDATES.md) - Recent changes

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🔑 Quick Links

### Firebase Console
- [Firebase Console](https://console.firebase.google.com)
- [Authentication](https://console.firebase.google.com/project/_/authentication)
- [Firestore Database](https://console.firebase.google.com/project/_/firestore)
- [Storage](https://console.firebase.google.com/project/_/storage)

### Vercel
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Deploy New Project](https://vercel.com/new)

### Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

---

## 🎯 Key Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing page |
| `/hackathon` | Public | Overview (hero, intro, CTAs) |
| `/hackathon/participants` | Public | Participant count, join projects |
| `/hackathon/gallery` | Public | Browse all projects |
| `/hackathon/resources` | Public | Learning links + rules (`/hackathon/rules` → `#rules`) |
| `/hackathon/prizes` | Public | Prize list (Firestore `settings/main.prizes`) |
| `/register` | Public | Sign up (Google + email) |
| `/hackathon?login=1` | Public | Sign-in modal (`&reset=1`, `&redirect=`) |
| `/past-projects` | Public | IWD archive winners, stats, projects |
| `/hackathon/profile` | Protected | Hackathon profile (Buddies / directory settings) |
| `/hackathon/my-projects` | Protected | Your project + draft / final submission form |
| `/submit` | Public → redirect | → `/hackathon/my-projects?project=1` (preserves `?edit=`) |
| `/admin` | Admin | Submissions, winners, stats |
| `/admin/hackathons` | Admin | Registry + seed prizes |
| `/admin/users` | Admin | Users + `hackathonParticipations` |
| `/checkin` | Protected | Self check-in + organiser desk |
| `/vote` | Protected | Audience voting (after check-in) |
| `/admin/errors` | Admin | Client/API error logs |

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_HACKATHON_DATASET=io2026
NEXT_PUBLIC_ACTIVE_HACKATHON_ID=io2026Hackathon
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to find**: Firebase Console → Project Settings → Your apps

---

## 🏷️ Collections (IO 2026 — `NEXT_PUBLIC_HACKATHON_DATASET=io2026`)

| Collection | Purpose |
|-----------|---------|
| `io2026Hackathon_users` | User profiles & roles |
| `io2026Hackathon_projects` | Drafts & submissions (`hackathonId` + `userId` on every doc) |
| `io2026Hackathon_attendance` | Check-in (`/checkin`) |
| `iwd2026Hackathon_projects` | IWD archive (`/past-projects`, read-only client) |

Legacy `hackaton*` used when dataset env is unset.

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **admin** | Full access - manage everything |
| **moderator** | View submissions (future) |
| **user** | Submit projects, apply to programs |

**How to make admin**: See [FIREBASE_AUTH.md](./FIREBASE_AUTH.md#making-a-user-admin)

---

## 🆘 Common Issues

### "auth/unauthorized-domain"
→ Add Vercel domain to Firebase Authorized Domains

### "Permission denied" on Firestore
→ Check security rules are published

### Admin panel not showing
→ Set user role to "admin" in Firestore

### Build fails
→ Check environment variables are set

**Full list**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📞 Get Help

1. Check relevant documentation above
2. Search [issues](../../issues)
3. Open a [new issue](../../issues/new)
4. Join [discussions](../../discussions)

---

**Last Updated**: 2025-11-19

