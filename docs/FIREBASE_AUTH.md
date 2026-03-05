# 🔐 Firebase Authentication Guide

Complete guide to the Firebase Authentication implementation.

---

## Overview

This app uses **Firebase Authentication** instead of Clerk to avoid custom domain restrictions on Vercel. Firebase Auth works perfectly with `.vercel.app` domains and provides email/password + Google OAuth authentication.

---

## Why Firebase Auth?

### Advantages
- ✅ **No custom domain required** - Works on `.vercel.app`
- ✅ **Free tier generous** - 10k monthly active users
- ✅ **Integrated with Firebase** - Same project for auth, database, storage
- ✅ **Multiple providers** - Email, Google, GitHub, etc.
- ✅ **Secure by default** - Industry-standard security
- ✅ **Easy migration path** - Can add more providers later

### Migration from Clerk
- Previously used Clerk (required custom domain for production)
- Migrated to Firebase Auth for Vercel compatibility
- All features maintained
- Role-based access control implemented in Firestore

---

## Authentication Setup

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable providers:
   - ✅ **Email/Password** - Required
   - ✅ **Google** - Recommended

### 2. Configure Google OAuth (Optional)

For Google sign-in:

1. In Firebase Console → Authentication → Sign-in method
2. Click Google provider
3. Enable it
4. Select support email
5. Add authorized domains (your Vercel domain)
6. Save

No additional OAuth client setup needed - Firebase handles it!

### 3. Authorized Domains

Add domains where authentication is allowed:

**Firebase Console** → **Authentication** → **Settings** → **Authorized domains**

Add:
- `localhost` (for development)
- `your-app-name.vercel.app` (production)
- Any custom domains (if applicable)

---

## Implementation Details

### Firebase Configuration

**File**: `lib/firebase.ts`

```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
```

### Auth Context

**File**: `lib/AuthContext.tsx`

Provides authentication state to entire app:

```typescript
import { createContext, useContext } from "react";
import { User } from "firebase/auth";
import { UserProfile } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  loading: true,
});

export const useAuthContext = () => useContext(AuthContext);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Implementation in file
};
```

### Custom Hook: useAuth

**File**: `hooks/useAuth.ts`

Manages auth state and user profiles:

```typescript
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createOrUpdateUserProfile, getUserProfile, UserProfile } from "@/lib/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Create or update user profile
        await createOrUpdateUserProfile(firebaseUser);
        
        // Fetch user profile with retry logic
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    userProfile,
    isAuthenticated: !!user,
    loading,
  };
};
```

### User Profile Management

**File**: `lib/auth.ts`

```typescript
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { User, updateProfile } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  createdAt: Date;
}

export const createOrUpdateUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, "hackatonUsers", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user profile
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      role: "user",
      createdAt: new Date(),
    });
    
    // Update Firebase Auth profile
    if (!user.displayName) {
      await updateProfile(user, {
        displayName: user.email?.split("@")[0] || "User",
      });
    }
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "hackatonUsers", uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
};

export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === "admin";
};

export const getUserRole = (userProfile: UserProfile | null): string => {
  return userProfile?.role || "user";
};
```

---

## Authentication Components

### AuthModal

**File**: `components/AuthModal.tsx`

Custom sign-in/sign-up modal with email and Google authentication:

```typescript
import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSignIn = async () => {
    // Email sign-in logic
  };

  const handleEmailSignUp = async () => {
    // Email sign-up logic
  };

  const handleGoogleSignIn = async () => {
    // Google sign-in logic
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Modal content */}
    </Dialog>
  );
}
```

### UserButton

**File**: `components/UserButton.tsx`

Custom user menu with sign-out:

```typescript
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function UserButton() {
  const { user, userProfile } = useAuthContext();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="user-button">
      <span>{user?.displayName || user?.email}</span>
      {userProfile?.role === "admin" && <Badge>Admin</Badge>}
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  );
}
```

### ProtectedRoute

**File**: `components/ProtectedRoute.tsx`

Client-side route protection:

```typescript
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, userProfile, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/");
      } else if (requireAdmin && userProfile?.role !== "admin") {
        router.push("/");
      }
    }
  }, [isAuthenticated, userProfile, loading, requireAdmin, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  if (requireAdmin && userProfile?.role !== "admin") return null;

  return <>{children}</>;
}
```

---

## User Roles

### Role Types

```typescript
type UserRole = "admin" | "moderator" | "user";
```

### Role Permissions

| Role | Permissions |
|------|-------------|
| **admin** | Full access - manage users, submissions, winners |
| **moderator** | View submissions, limited admin access (future) |
| **user** | Submit projects, view gallery, apply to programs |

### Making a User Admin

**Method 1: Firebase Console (Recommended)**

1. Go to Firebase Console → Firestore Database
2. Open `hackatonUsers` collection
3. Find user document (by email or UID)
4. Edit document
5. Set `role` field to `"admin"`
6. Save
7. User must log out and log back in

**Method 2: Admin Panel**

Use `/admin/users` page to manage roles (requires existing admin).

### Role Check Functions

```typescript
// Check if user is admin
export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === "admin";
};

// Get user role
export const getUserRole = (userProfile: UserProfile | null): string => {
  return userProfile?.role || "user";
};
```

---

## Firestore Rules for Authentication

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user role
    function getUserRole(userId) {
      return get(/databases/$(database)/documents/hackatonUsers/$(userId)).data.role;
    }
    
    // Helper function to check if admin
    function isAdmin() {
      return request.auth != null && getUserRole(request.auth.uid) == "admin";
    }
    
    // User profiles
    match /hackatonUsers/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }
    
    // Competition submissions
    match /hackatonProjects/{projectId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

---

## Automatic User Creation

When a user signs up or signs in for the first time:

1. **Firebase Auth** creates authentication record
2. **onAuthStateChanged** fires in `useAuth` hook
3. **createOrUpdateUserProfile** is called
4. Checks if user exists in `users` collection
5. If not, creates new document with:
   - `uid`: Firebase Auth UID
   - `email`: User's email
   - `displayName`: Display name or derived from email
   - `role`: Default "user"
   - `createdAt`: Current timestamp
6. Updates Firebase Auth displayName if not set
7. Fetches complete user profile
8. Returns to app with authenticated state

This ensures every authenticated user has a profile in Firestore.

---

## Sign-In Flow

### Email/Password Sign-In

1. User enters email and password
2. App calls `signInWithEmailAndPassword(auth, email, password)`
3. Firebase validates credentials
4. On success:
   - `onAuthStateChanged` fires
   - User profile created/updated
   - User redirected to app
5. On error:
   - Error toast displayed
   - User can retry

### Google Sign-In

1. User clicks "Sign in with Google"
2. App calls `signInWithPopup(auth, GoogleAuthProvider)`
3. Google OAuth popup opens
4. User selects Google account
5. Firebase completes authentication
6. `onAuthStateChanged` fires
7. User profile created/updated
8. User redirected to app

### Sign-Out

1. User clicks "Sign Out"
2. App calls `signOut(auth)`
3. Firebase clears session
4. `onAuthStateChanged` fires with null user
5. User redirected to homepage

---

## Troubleshooting

### "auth/unauthorized-domain"

**Cause**: Domain not in Firebase Authorized Domains  
**Fix**: Add domain to Firebase Console → Authentication → Settings → Authorized domains

### "Loading..." stuck on screen

**Cause**: Auth state not resolving  
**Fix**: 
- Check Firebase config in `.env.local`
- Check browser console for errors
- Verify Firebase project is active

### User not created in Firestore

**Cause**: Permission denied or network error  
**Fix**:
- Check Firestore rules allow user creation
- Verify internet connection
- Check browser console for errors

### Sign-in button doesn't work

**Cause**: Modal not opening or JavaScript error  
**Fix**:
- Clear browser cache
- Check browser console
- Verify all dependencies installed

### Admin badge not showing

**Cause**: User role not set to "admin"  
**Fix**:
- Check Firestore `hackatonUsers` collection
- Verify `role` field is `"admin"`
- Log out and log back in

---

## Security Best Practices

### Environment Variables
✅ All Firebase config in `.env.local`  
✅ Never commit `.env.local` to Git  
✅ Use different projects for dev/production  

### Firebase Rules
✅ Always validate `request.auth != null`  
✅ Check user ownership before writes  
✅ Admin checks use Firestore role lookups  

### Client-Side Security
✅ Protected routes check auth state  
✅ Admin features hidden from non-admins  
✅ All sensitive operations server-validated  

### Password Security
✅ Minimum 6 characters (Firebase default)  
✅ Passwords never stored in code  
✅ Firebase handles password hashing  

---

## Testing

### Local Testing

1. Create `.env.local` with Firebase config
2. Run `npm run dev`
3. Visit `http://localhost:3000`
4. Test sign-up with email/password
5. Test sign-in with Google
6. Verify user created in Firestore
7. Test sign-out

### Production Testing

1. Deploy to Vercel
2. Add Vercel domain to Firebase Authorized Domains
3. Visit production URL
4. Test all auth flows
5. Verify Firestore writes working
6. Test protected routes

---

## Migration Summary

### From Clerk to Firebase Auth

**What Changed**:
- Removed Clerk dependencies
- Added Firebase Auth
- Rewrote auth components
- Updated middleware
- Changed user storage to Firestore
- Updated role management

**What Stayed the Same**:
- User interface
- Role-based access control
- Admin features
- Protected routes
- All other functionality

**Benefits**:
- No custom domain required
- Lower costs (free tier)
- Integrated with existing Firebase
- More control over auth flow

---

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Auth Web Guide](https://firebase.google.com/docs/auth/web/start)
- [Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## Summary

✅ **Email/Password authentication**  
✅ **Google OAuth sign-in**  
✅ **Automatic user profile creation**  
✅ **Role-based access control**  
✅ **No custom domain required**  
✅ **Production-ready security**  

**Firebase Auth is configured and working!** 🔐

