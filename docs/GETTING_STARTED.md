# Getting Started - Devfest 2025 Competition Form

Simple guide to get up and running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

## Quick Setup

### 1. Install Dependencies (2 min)

```bash
npm install
```

### 2. Set Up Environment Variables (5 min)

Create `.env.local` file in the project root:

```env
# Firebase (firebase.google.com — Auth, Firestore, Storage)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
# NEXT_PUBLIC_HACKATHON_DATASET=io2026
```

**Get Firebase keys:**
1. Visit [firebase.google.com](https://firebase.google.com) → Sign in
2. Create project → Enable Firestore & Storage
3. Project Settings → Web app → Copy config

**Configure Firebase:**
- Firestore Rules (Production mode)
- Storage Rules (Production mode)
- See firebase-rules.txt for rules to copy

### 3. Run the App (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Admin Access

**Login**: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin`

⚠️ Change for production in `app/admin/login/page.tsx`

## Key Features

- **Submit** (`/hackathon/my-projects` — project + form; `/submit` redirects) - Users submit projects with drafts
- **Gallery** (`/gallery`) - Public view of submissions
- **Admin** (`/admin`) - Manage winners (login required)

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## Need Help?

- Check `firebase-rules.txt` for Firebase setup
- Issues? Open GitHub issue
- Questions? Check code comments

## Project Structure

```
app/
├── page.tsx          # Home page
├── hackathon/profile/   # Hackathon profile (directory / buddies)
├── hackathon/my-projects/  # Your project + submission form (canonical)
├── submit/              # Redirects to hackathon/my-projects?project=1
├── gallery/          # Public gallery
└── admin/            # Admin panel
components/ui/        # UI components
lib/                  # Firebase & utilities
types/                # TypeScript types
```

## What's Included

✅ Next.js 14 + TypeScript
✅ Firebase Auth (email/password + Google)
✅ Firebase (Firestore + Storage + Cloud Functions)
✅ shadcn/ui components
✅ Dark mode by default
✅ Poppins font
✅ Fully responsive

---

**That's it!** Start building → `npm run dev`

