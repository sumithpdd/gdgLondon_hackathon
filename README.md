# GDG London Hackathon - Competition Entry Form

> **🚀 Hackathon competition submission platform built with Next.js & Firebase**

A modern web application for managing project submissions for the GDG London Hackathon competition. Based on [DevfestCompetitionForm](https://github.com/sumithpdd/DevfestCompetitionForm).

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.14-orange)](https://firebase.google.com/)

---

## ✨ Features

### Competition Platform
- 🔐 **Authentication** - Firebase Auth with Email/Password & Google
- 📝 **Draft System** - Save and resume submissions
- 📸 **Multi-Upload** - Up to 5 screenshots per project
- 🏆 **Winner Selection** - Admin panel for selecting top 3
- 🎯 **Social Integration** - Profile tags and social links
- 👥 **User Roles** - Admin, Moderator, and User roles
- 📱 **Responsive** - Works on all devices

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Setup Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password + Google)
3. Create Firestore database
4. Enable Storage
5. Update Firestore and Storage rules (see [docs/FIRESTORE_RULES.md](docs/FIRESTORE_RULES.md))

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

### 🌱 New to the Project?
- **[docs/START_HERE.md](docs/START_HERE.md)** - Complete beginner's guide
- **[docs/FEATURES_SIMPLE.md](docs/FEATURES_SIMPLE.md)** - What the app does

### 🚀 Ready to Deploy?
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide (5 minutes)
- **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** - Firebase configuration
- **[docs/CHECKLIST.md](docs/CHECKLIST.md)** - Pre-deployment checklist

### 🔧 Developer Guides
- **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** - Firestore collections (hackatonUsers, hackatonProjects)
- **[docs/FIREBASE_AUTH.md](docs/FIREBASE_AUTH.md)** - Authentication implementation
- **[docs/FIRESTORE_RULES.md](docs/FIRESTORE_RULES.md)** - Security rules
- **[docs/FEATURES.md](docs/FEATURES.md)** - Complete feature list

### 🆘 Need Help?
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and fixes
- **[docs/README.md](docs/README.md)** - Complete documentation index

---

## 🚢 Deploy to Vercel

### Quick Deploy

```bash
npm install -g vercel
vercel --prod
```

**Complete guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Key Points

✅ **No custom domain required** - Works on `.vercel.app`  
✅ **Just 6 environment variables** - Simple setup  
✅ **Firebase Auth** - Email & Google sign-in  
✅ **5-minute deployment** - Get live quickly

---

## 📂 Project Structure

```
DevfestCompetitionForm/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Home page
│   ├── submit/              # Submission form
│   ├── gallery/             # Public gallery
│   ├── hackathon/           # Hackathon pages (overview, gallery, etc.)
│   └── admin/               # Admin panel
├── components/              # React components
│   ├── ui/                  # shadcn UI components
│   ├── AuthModal.tsx        # Sign-in modal
│   ├── UserButton.tsx       # User menu
│   ├── ProtectedRoute.tsx   # Route protection
│   └── TagSelector.tsx      # Tag selection
├── lib/                     # Utilities
│   ├── firebase.ts          # Firebase config
│   ├── auth.ts              # Auth helpers
│   ├── AuthContext.tsx      # Auth context
│   └── validators.ts        # Input validation
├── hooks/                   # Custom hooks
│   └── useAuth.ts           # Auth state hook
├── docs/                    # Documentation
└── public/                  # Static assets
```

---

## 🎯 Key Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/submit` | Protected | Submit projects (with drafts) |
| `/gallery` | Public | View all submissions |
| `/admin` | Admin | Manage submissions & winners |
| `/admin/users` | Admin | User role management |
| `/hackathon` | Public | Hackathon overview |
| `/hackathon/gallery` | Public | Project gallery |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.6
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **UI**: shadcn/ui + Tailwind CSS
- **Font**: Poppins
- **Deployment**: Vercel

---

## 🔒 Security

✅ Firebase Authentication with Email/Password & Google  
✅ Role-based access control (Admin, Moderator, User)  
✅ Firestore security rules  
✅ Storage security rules  
✅ Environment variables in `.env.local` (gitignored)  
✅ Protected routes with authentication checks  

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🆘 Support

- 📖 Check [docs/](docs/) for complete guides
- 🐛 Open a [GitHub issue](../../issues)
- 💬 Join [discussions](../../discussions)

---

## 🎉 Event Details

- **Event**: DevFest 2025 London
- **Date**: November 22nd, 2025
- **Location**: LSE Centre Building (CBG), WC2A 2AE
- **Theme**: AI Innovation Lab Competition

---

**Built with ❤️ for DevFest 2025 London**

🔗 [Documentation](docs/) | [Deploy Guide](docs/DEPLOYMENT.md) | [Troubleshooting](docs/TROUBLESHOOTING.md)
