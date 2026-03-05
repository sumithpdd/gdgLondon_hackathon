# 📖 Quick Reference Guide

> **One-page guide to find everything you need**

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
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CHECKLIST.md](./CHECKLIST.md) - Pre-deployment checklist

### Features
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
| `/submit` | Protected | Submit projects |
| `/gallery` | Public | View submissions |
| `/admin` | Admin | Admin panel |
| `/admin/users` | Admin | User management |

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

**Where to find**: Firebase Console → Project Settings → Your apps

---

## 🏷️ Collections

| Collection | Purpose |
|-----------|---------|
| `hackatonUsers` | User profiles & roles |
| `hackatonProjects` | Hackathon project submissions |

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

