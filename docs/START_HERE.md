# 🚀 Start Here - Complete Beginner's Guide

> **Updated onboarding:** Prefer **[JUNIOR_ONBOARDING.md](./JUNIOR_ONBOARDING.md)** for current flows, Firestore schema, admin Cloud Functions, and stack (Firebase Auth — not Clerk). This page is kept for general React/Next concepts but some sections below are outdated.

Welcome! This guide is for developers new to React, Next.js, and Firebase.

---

## 📖 What Is This App?

A competition submission platform for DevFest 2025 London AI Innovation Lab where:
- **Users** can submit their AI projects with screenshots
- **Admins** can review submissions and select winners
- **Everyone** can view the public gallery of projects

---

## 🧩 Technologies Used (Simple Explanation)

### React ⚛️
**What it is**: A JavaScript library for building user interfaces  
**What it does here**: Creates interactive components (buttons, forms, cards)  
**You'll see**: Files with `.tsx` extension, components with `<Button>`, `<Card>`, etc.

### Next.js 🔷
**What it is**: A React framework that adds routing and server features  
**What it does here**: 
- Handles page navigation (`/`, `/hackathon/profile`, `/gallery`; `/submit` redirects to profile)
- Renders pages on the server for better performance
- Organizes our app structure  

**You'll see**: `app/` folder with `page.tsx` files for each route

### Firebase Auth 🔐
**What it is**: Google’s authentication for the app (email/password + Google sign-in)  
**What it does here**:
- Manages sign up, sign in, sign out, password reset
- User id (`uid`) matches Firestore profile document id
- Roles (`admin`, `moderator`, `user`) live on the user profile in Firestore  

**You'll see**: `AuthModal`, `useAuthContext()`, `lib/auth.ts`

### Firebase 🔥
**What it is**: Google's backend platform  
**What it does here**:
- **Firestore**: Database that stores submissions
- **Storage**: Stores screenshot images
- **Security Rules**: Controls who can read/write data  

**You'll see**: `db`, `storage`, `collection()`, `addDoc()` in code

### Tailwind CSS 🎨
**What it is**: CSS framework with utility classes  
**What it does here**: Styles the app with pre-made classes  
**You'll see**: `className="bg-blue-600 text-white p-4"` (classes that style elements)

### shadcn/ui 🎭
**What it is**: Pre-built React components  
**What it does here**: Provides ready-to-use UI components (buttons, cards, dialogs)  
**You'll see**: Components imported from `@/components/ui/`

---

## 📁 Project Structure (Simplified)

```
DevfestCompetitionForm/
│
├── app/                          # All pages (Next.js routing)
│   ├── page.tsx                  # Home page (/)
│   ├── submit/page.tsx           # Redirect → /hackathon/my-projects?project=1
│   ├── gallery/page.tsx          # Gallery page (/gallery)
│   └── admin/
│       ├── page.tsx              # Admin dashboard (/admin)
│       └── users/page.tsx        # User management (/admin/users)
│
├── components/                   # Reusable components
│   ├── UserNav.tsx               # Role badge + admin button
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── lib/                          # Helper functions
│   ├── firebase.ts               # Firebase setup
│   └── utils.ts                  # General utilities
│
├── utils/                        # Additional utilities
│   └── roles.ts                  # Role checking functions
│
├── types/                        # TypeScript types
│   └── globals.d.ts              # Role type definitions
│
├── public/                       # Static files (images, logos)
│   ├── devfest-london-logo.png
│   └── AI_Innovation_Hub.png
│
├── docs/                         # Documentation
│
└── .env.local                    # Environment variables (secrets)
```

---

## 🎯 How the App Works (User Flow)

### For Regular Users:

```
1. Visit Homepage (/)
   ↓
2. Click "Sign In" (Firebase Auth modal)
   ↓
3. Click "Submit Your Project"
   ↓
4. Fill form with project details
   ↓
5. Upload screenshots (saved to Firebase Storage)
   ↓
6. Click "Submit" (saved to Firestore database)
   ↓
7. View project in Gallery
```

### For Admins:

```
1. Log in with admin account
   ↓
2. See "Admin" badge + "Admin Panel" button in header
   ↓
3. Click "Admin Panel"
   ↓
4. View all submissions
   ↓
5. Select winners (1st, 2nd, 3rd place)
   ↓
6. Click "Manage User Roles" to promote users
```

---

## 🛠️ Setup (Step-by-Step for Beginners)

### Prerequisites (Install These First):

1. **Node.js** (version 18+): [Download here](https://nodejs.org/)
2. **Code Editor**: [VS Code](https://code.visualstudio.com/) (recommended)
3. **Git**: [Download here](https://git-scm.com/)

### Step 1: Get the Code

```bash
# Open terminal/command prompt
# Navigate to where you want the project
cd C:\code\react\

# If you have the code already, you're in the right place!
# Otherwise, clone from Git:
git clone <your-repo-url>
cd DevfestCompetitionForm
```

### Step 2: Install Dependencies

```bash
# This downloads all required packages
npm install

# Wait for it to finish (can take 2-5 minutes)
```

### Step 3: Setup Environment Variables

1. Copy the example file:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env.local
   
   # Mac/Linux
   cp .env.example .env.local
   ```

2. Open `.env.local` in VS Code

3. Fill in your keys (see next section)

**Important**: Never commit `.env.local` to Git! It's already in `.gitignore` to protect your secrets.

### Step 4: Get Your API Keys

#### Firebase keys (Auth, Firestore, Storage):
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Sign up/login with Google account
3. Click "Create Project" (or select existing)
4. Add Web App (click `</>` icon)
5. Copy all config values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```
6. Paste into `.env.local`

### Step 5: Configure Firebase Rules

1. In Firebase Console → Firestore Database
2. Click "Rules" tab
3. Copy rules from `firebase-rules.txt` (Firestore section)
4. Paste and Publish

5. In Firebase Console → Storage
6. Click "Rules" tab
7. Copy rules from `firebase-rules.txt` (Storage section)
8. Paste and Publish

### Step 6: Enable Firebase Authentication

1. Firebase Console → **Authentication** → Sign-in method
2. Enable **Email/Password** and **Google**
3. Add `localhost` and your production domain under **Authorized domains**

### Step 7: Run the App!

```bash
npm run dev
```

Open browser and go to: `http://localhost:3000`

---

## ✅ Quick Test Checklist

After setup, test these:

- [ ] Home page loads
- [ ] Click "Sign In" opens Firebase auth modal
- [ ] Sign up with email
- [ ] See "User" badge in header
- [ ] Navigate to `/hackathon/my-projects?project=1` (or `/submit`)
- [ ] Fill and submit form (test with dummy data)
- [ ] Check Firebase Console → Firestore to see your submission
- [ ] Visit `/gallery` to see your project

---

## 🔍 Understanding Key Concepts

### What is "Client" vs "Server" Components?

In Next.js, components can run in two places:

**Server Components** (default):
- Run on the server
- Can access databases directly
- Faster initial load
- Can't use browser features (clicks, state)

**Client Components** (`"use client"` at top):
- Run in the browser
- Can use React hooks (`useState`, `useEffect`)
- Can handle user interactions (clicks, forms)
- Can't access server secrets

**Example**:
```typescript
"use client"  // ← This makes it a client component

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)  // ← Only works in client
  
  return <button onClick={() => setCount(count + 1)}>
    Count: {count}
  </button>
}
```

### What are Hooks?

Hooks are special React functions that start with `use`:

- **`useState`**: Store data that changes
  ```typescript
  const [name, setName] = useState("")
  // name = current value
  // setName = function to update it
  ```

- **`useEffect`**: Run code when component loads
  ```typescript
  useEffect(() => {
    // This runs once when component appears
    fetchData()
  }, [])
  ```

- **`useAuthContext`**: Get current user + Firestore profile
  ```typescript
  const { user, userProfile, isAuthenticated } = useAuthContext()
  console.log(user?.email, userProfile?.role)
  ```

### What is TypeScript?

TypeScript = JavaScript + Types

**Types** tell the code what kind of data to expect:

```typescript
// Without types (JavaScript)
function greet(name) {
  return "Hello " + name
}

// With types (TypeScript)
function greet(name: string) {
  return "Hello " + name
}

greet(123)  // ❌ TypeScript catches this error!
```

**Benefits**:
- Catches errors before running code
- Better autocomplete in VS Code
- Makes code easier to understand

---

## 📚 Next Steps

1. **Read**: [GETTING_STARTED.md](GETTING_STARTED.md) - Detailed explanations
2. **Setup Admin**: [DEPLOYMENT.md](DEPLOYMENT.md) Step 4 - Set `role: "admin"` in Firestore `users`
3. **Learn Features**: [FEATURES.md](FEATURES.md) - What the app can do
4. **Deploy**: [DEPLOYMENT.md](DEPLOYMENT.md) - Put it online with Vercel

---

## 💡 Common Terms Explained

| Term | What It Means |
|------|---------------|
| **Component** | Reusable piece of UI (like a Lego block) |
| **Props** | Data passed to a component (like function arguments) |
| **State** | Data that can change (causes re-render when updated) |
| **Route** | URL path (like `/hackathon/profile` or `/gallery`) |
| **API** | Way for code to communicate with external services |
| **Environment Variable** | Secret configuration stored in `.env.local` |
| **Hook** | Special React function (starts with `use`) |
| **Async/Await** | Way to wait for operations to complete |
| **Collection** | Folder in Firestore that holds documents |
| **Document** | Single record in Firestore (like a row in Excel) |

---

## 🆘 Getting Help

**If something doesn't work**:

1. Check browser console (F12 → Console tab)
2. Look for error messages in terminal
3. Read error message carefully
4. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
5. Verify `.env.local` has all values filled

**Learning Resources**:
- [React Docs](https://react.dev) - Official React documentation
- [Next.js Docs](https://nextjs.org/docs) - Official Next.js docs
- [Firebase Auth](https://firebase.google.com/docs/auth) - Authentication
- [Firebase Docs](https://firebase.google.com/docs) - Firestore, Storage, Functions

---

---

## 🌐 Production URL

When deployed: **https://comp.devfestlondon.com**

---

**You're ready to start! Open [GETTING_STARTED.md](GETTING_STARTED.md) for the next step.** 🚀
