# Environment Variables Guide

This guide explains all environment variables needed for the app and how to get them.

---

## 📋 Required Environment Variables

### Firebase (Authentication, Database & Storage)

**All environment variables are for Firebase - No Clerk needed! ✅**

### Firebase (Database & Storage)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| Firebase API key | Web API key for client | Firebase Console → Project Settings → Web App |
| Auth domain | Auth domain for your project | Firebase Console → Project Settings |
| Project ID | Firebase project identifier | Firebase Console → Project Settings |
| Storage bucket | Storage bucket identifier | Firebase Console → Project Settings |
| Messaging sender ID | For Firebase Cloud Messaging | Firebase Console → Project Settings |
| App ID | Firebase web app ID | Firebase Console → Project Settings |

**Note:** Exact variable names are in `.env.example`. Do not document actual key values.

**How to get Firebase config:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create new one)
3. Click gear icon → Project Settings
4. Scroll to "Your apps" section
5. Click "Web app" icon (`</>`) or select existing web app
6. Copy all config values

---

## 🔧 Setup Instructions

### Local Development

1. **Copy the example file:**
   ```bash
   # Windows
   copy .env.example .env.local
   
   # Mac/Linux
   cp .env.example .env.local
   ```

2. **Open `.env.local` in your editor**

3. **Replace placeholder values** with your Firebase config from the Firebase Console

4. **Save the file**

5. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### Production (Vercel)

**Never commit `.env.local` to Git!**

Instead, add environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from `.env.example` (names only—values from Firebase Console)
   - Environment: Production, Preview, Development (check all)
5. Click "Save"
6. Repeat for all variables

**After adding variables:**
- Redeploy your app for changes to take effect

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use `.env.local` for local development
- ✅ Add variables to Vercel for production
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys if they're ever exposed

### ❌ DON'T:
- ❌ Commit `.env.local` to Git
- ❌ Share keys in Slack/Discord/Email
- ❌ Hardcode keys in source code
- ❌ Push keys to GitHub
- ❌ Use production keys in development

---

## 🔍 Understanding `NEXT_PUBLIC_` Prefix

### Variables with `NEXT_PUBLIC_` prefix:
- **Accessible in browser** (client-side)
- **Included in JavaScript bundle**
- **Safe to expose** (they're meant to be public)
- Used in client components

### Variables without `NEXT_PUBLIC_`:
- **Only accessible on server**
- **Never sent to browser**
- **Must be kept secret**
- Used in server components and API routes

---

## 🧪 Verify Environment Variables

Create this test page to verify your variables are loaded:

Create a test page that checks `process.env.NEXT_PUBLIC_*` variables are set (without displaying values). Delete after verifying.

---

## 🐛 Troubleshooting

### "Environment variable not found"

**Solution:**
1. Make sure `.env.local` exists in project root
2. Restart dev server (`npm run dev`)
3. Check variable name spelling (case-sensitive!)
4. Verify no extra spaces before/after `=`

### "Firebase: Error (auth/invalid-api-key)"

**Solution:**
1. Verify API key in Firebase Console
2. Check the key hasn't been restricted
3. Make sure you're using the Web API key (not iOS/Android)
4. Try creating a new Web app in Firebase

### Variables work locally but not in Vercel

**Solution:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Make sure all variables are added
3. Check they're enabled for Production environment
4. Redeploy the project

---

## 📚 Related Documentation

- [Clerk Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## ✅ Checklist

Before running the app:

- [ ] Created `.env.local` from `.env.example`
- [ ] Added Clerk publishable key
- [ ] Added Clerk secret key
- [ ] Added all 6 Firebase config values
- [ ] No placeholder text remaining
- [ ] Restarted dev server
- [ ] App runs without env errors

Before deploying to Vercel:

- [ ] All variables added to Vercel dashboard
- [ ] Variables enabled for Production
- [ ] Test deployment successful
- [ ] No hardcoded keys in code

---

**Keep your keys secure! 🔒**

