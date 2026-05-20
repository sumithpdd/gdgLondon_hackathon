# 🎯 App Features (Simple Explanation)

This document explains what the app can do and how each feature works.

---

## 👤 For Regular Users

### 1. Sign Up / Sign In 🔐

**What it does**: Creates an account or logs you in  
**How it works**: Firebase Authentication (email/password + Google)

**Steps**:
1. Click "Sign In" (or register at `/register`)
2. Auth modal opens (`AuthModal` / `HackathonAuthShell`)
3. Sign in with email/password or Google
4. Profile is created/updated in Firestore (`io2026Hackathon_users` when dataset=io2026)

**Behind the scenes**:
- Firebase Auth stores credentials
- `createOrUpdateUserProfile` syncs `io2026Hackathon_users/{uid}`
- Roles (`admin` / `moderator` / `user`) live on the Firestore user doc

**Files involved**:
- `components/AuthModal.tsx`, `components/HackathonAuthShell.tsx`
- `lib/auth.ts`, `lib/user-profile-sync.ts`, `hooks/useAuth.ts`

---

### 2. My project — Save progress & Ship it 📤

**What it does**: Lets you draft and submit your hackathon project for the **current edition**.

**Where**: `/hackathon/my-projects` (`?project=1` opens the form). `/submit` redirects here.

**Steps**:
1. Sign in and open **My Projects**
2. Fill in title, description, GitHub, demo video, screenshots, team info, etc.
3. Click **Save progress** to store a draft (come back anytime)
4. When ready, click **Ship it! — Final submission** (validates required fields)

**What happens**:
```
Fill form → Upload screenshots to Storage → saveProjectDocument() → io2026Hackathon_projects
```

**Behind the scenes**:
- `lib/project-submissions.ts` stamps **`userId`**, **`userEmail`**, **`hackathonId`** (`io2026Hackathon`), **`hackathonName`** on every save
- Collection: **`io2026Hackathon_projects`** when `NEXT_PUBLIC_HACKATHON_DATASET=io2026`
- **Save progress** → `status: "draft"` (hidden from public gallery)
- **Ship it** → `status: "submitted"` (visible in gallery)
- Profile page (`/hackathon/profile`) is separate — used for directory / joining teams, not the project form

**Files involved**:
- `components/ProjectSubmissionForm.tsx` — form UI
- `lib/project-submissions.ts` — Firestore create/update
- `app/hackathon/my-projects/page.tsx` — project card + form
- `app/submit/page.tsx` — redirect to my-projects

---

### 3. Save progress (draft) 💾

**What it does**: Saves incomplete work without final submission.

**Why it's useful**:
- Come back later to finish
- Don't lose your work
- Add screenshots over multiple sessions

**Behind the scenes**:
- `findUserProjectForActiveHackathon(uid)` loads your project for the active `hackathonId`
- Updates existing doc or creates a new one in `io2026Hackathon_projects`

---

### 4. View Gallery 🖼️

**What it does**: Shows all submitted projects  
**How it works**: Reads from Firestore and displays as cards

**Steps**:
1. Go to `/gallery` (or click from home)
2. See all submitted projects
3. Click on screenshots to view full-screen
4. See winner badges (🥇 🥈 🥉)

**What you see**:
- Project name
- Submission date
- Main screenshot + thumbnails
- Project description
- Interest tags
- Social links
- Winner badge (if selected)

**Behind the scenes**:
```typescript
// Fetch all submissions
const q = query(collection(db, "hackatonProjects"), orderBy("createdAt", "desc"))
const querySnapshot = await getDocs(q)

// Filter to only show submitted (not drafts)
const submitted = data.filter(sub => sub.status === "submitted")
```

**Files involved**:
- `app/gallery/page.tsx` - Gallery display

---

## 🛡️ For Admins

### 5. Admin Panel 👨‍💼

**What it does**: Dashboard to manage everything  
**How it works**: Special page only admins can access

**What you see**:
- Total submissions count
- Number of drafts vs submitted
- Winners selected count
- All submissions (with drafts)
- Options to:
  - Select winners
  - Delete submissions
  - View all photos

**Access Control**:
```typescript
// Check if user is admin
const role = user.publicMetadata.role
if (role !== "admin") {
  // Show "Access Denied"
  // Redirect to home
}
```

**Files involved**:
- `app/admin/page.tsx` - Admin dashboard
- `utils/roles.ts` - Role checking

---

### 6. Select Winners 🏆

**What it does**: Choose 1st, 2nd, 3rd place  
**How it works**: Dropdown menu that updates Firestore

**Steps**:
1. Go to `/admin`
2. Find a submission
3. Click dropdown under "Select Winner"
4. Choose: First Place / Second Place / Third Place
5. Automatically saves to database

**Behind the scenes**:
```typescript
// Update submission in Firestore
await updateDoc(doc(db, "projects", submissionId), {
  place: "first"  // or "second" or "third"
})
```

**Winners show**:
- On gallery page with colored badges
- At top of admin panel in "Winners" section

**Files involved**:
- `app/admin/page.tsx` - Has winner selection

---

### 7. Delete Submissions 🗑️

**What it does**: Removes a submission completely  
**How it works**: Deletes from Storage AND Firestore

**Steps**:
1. Go to `/admin`
2. Find submission to delete
3. Click "Delete" button
4. Confirm in popup dialog
5. Submission and all photos deleted

**Behind the scenes**:
```typescript
// 1. Delete all screenshots from Storage
for (const screenshotUrl of submission.screenshots) {
  const storageRef = ref(storage, screenshotUrl)
  await deleteObject(storageRef)
}

// 2. Delete submission document from Firestore
await deleteDoc(doc(db, "hackatonProjects", submissionId))
```

**Warning**: This is permanent! No undo.

**Files involved**:
- `app/admin/page.tsx` - Has delete button
- Uses Firebase Storage and Firestore APIs

---

### 8. User Role Management 👥

**What it does**: Promote users to admin or moderator  
**How it works**: Cloud Function `setUserRole` updates Firestore `role` on user docs

**Steps**:
1. Go to `/admin/users`
2. Search for user by name or email
3. Click **Admin** / **Moderator** / **User**
4. User should refresh or sign in again to see nav changes

**Behind the scenes**:
- `lib/admin-users.ts` → `setUserRole` callable
- Updates `io2026Hackathon_users` (and legacy `hackatonUsers` if present)
- Firestore rules enforce admin-only cross-user writes

**Roles explained**:
- **Admin**: Full dashboard, users, voting, content
- **Moderator**: Organiser vote budget (10 votes); limited admin UI
- **User**: Standard participant

**Files involved**:
- `app/admin/users/page.tsx`
- `lib/admin-users.ts`, `functions/src/index.ts` (`setUserRole`)

---

## 🎨 UI Features

### 9. Role Badges 🏷️

**What it does**: Shows your role in the header  
**How it works**: Reads `userProfile.role` from Firestore via `useAuthContext`

**Displays**:
- **Admin** — admin nav + panel
- **Moderator** — badge in app bar
- **User** — standard participant

**Files involved**:
- `components/HackathonAppBar.tsx`, `lib/AuthContext.tsx`

---

### 10. Event gallery (photos & videos) 🎬

**What it does**: Attendees share event media; organisers moderate; everyone browses an approved carousel.

**Routes**:
- `/hackathon/photos` — multi-upload queue, rename before submit, public carousel (images + videos)
- `/admin/photos` — pending queue, bulk approve, gallery editor (order + rename)

**Rules**:
- Max **10** items per attendee (pending + approved)
- Attendee uploads start as **`pending`** until an organiser approves
- Images ≤ 10 MB; videos ≤ 50 MB (MP4 / WebM / MOV)

**Behind the scenes**: `reserveEventPhotoUpload` → Firebase Storage → `finalizeEventPhotoUpload` → admin **Approve** → carousel.

**Files involved**:
- `app/hackathon/photos/page.tsx`
- `lib/event-photos.ts`, `types/event-photo.ts`
- `components/photos/*`, `components/admin/AdminEventPhotosPanel.tsx`

Journey diagram: [USER_FLOW.md § Option H](./USER_FLOW.md#option-h-event-gallery-photos--videos).

---

### 11. Photo Gallery Viewer (project screenshots) 📸

**What it does**: View screenshots in full-screen  
**How it works**: Dialog modal with navigation

**Features**:
- Click any screenshot to enlarge
- Navigate with Previous/Next buttons
- See which photo you're on (e.g. "2 of 5")
- Close with X or click outside

**Behind the scenes**:
```typescript
const [selectedScreenshots, setSelectedScreenshots] = useState([])
const [currentIndex, setCurrentIndex] = useState(0)

// Click image
onClick={() => {
  setSelectedScreenshots(submission.screenshots)
  setCurrentIndex(0)
  setShowDialog(true)
}}
```

**Files involved**:
- `app/gallery/page.tsx` - Has photo viewer
- `app/admin/page.tsx` - Also has photo viewer
- `components/ui/dialog.tsx` - Modal component

---

## 🔒 Security Features

### 12. Access Control 🚪

**What it does**: Ensures only authorized users access certain pages  
**How it works**: Checks roles before showing content

**Protected Routes**:
```
/hackathon/my-projects?project=1  →  Project submission (signed in); `/submit` redirects here
/admin        → Must have admin role
/admin/users  → Must have admin role
```

**How it's enforced**:
```typescript
// Client-side (UX)
if (!user || role !== 'admin') {
  return <AccessDenied />
}

// Server-side (security)
if (!(await checkRole('admin'))) {
  redirect('/')
}
```

**Multiple layers**:
1. **Firebase Auth** + client routes (`ProtectedRoute`, `useAuthContext`)
2. **Client Component** - Shows/hides UI
3. **Server Component** - Redirects unauthorized users
4. **Server Actions** - Validates before database changes

---

### 13. Form Validation ✅

**What it does**: Checks form data before submitting  
**How it works**: Client-side checks + server-side checks

**Validations**:
- Required fields (name, email, GitHub, description)
- Email format
- URL format for links
- File size limits (10MB per image)
- File type (only images)

**Behind the scenes**:
```typescript
// Check required fields
if (!formData.fullName || !formData.email) {
  toast({ title: "Error", description: "Please fill all fields" })
  return
}

// Check file size
if (file.size > 10 * 1024 * 1024) {
  toast({ title: "Error", description: "File too large (max 10MB)" })
  return
}
```

**Files involved**:
- `components/ProjectSubmissionForm.tsx` - Has validation

---

## 🎨 Styling Features

### 14. Responsive Design 📱

**What it does**: Looks good on all devices  
**How it works**: Tailwind CSS responsive classes

**Breakpoints**:
```
sm: 640px   (tablet)
md: 768px   (tablet landscape)
lg: 1024px  (laptop)
xl: 1280px  (desktop)
```

**Example**:
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

### 15. Loading States ⏳

**What it does**: Shows feedback while waiting  
**How it works**: Conditional rendering

**Types**:
- Spinner for page loads
- "Submitting..." on buttons
- "Loading..." text

**Example**:
```typescript
{loading ? (
  <Loader2 className="animate-spin" />
) : (
  "Submit"
)}
```

---

### 16. Toast Notifications 🔔

**What it does**: Shows success/error messages  
**How it works**: shadcn/ui toast component

**Types**:
- ✅ Success (green)
- ❌ Error (red)
- ℹ️ Info (blue)

**Example**:
```typescript
toast({
  title: "Success!",
  description: "Project submitted successfully"
})
```

---

## 📊 Data Flow (How Everything Connects)

```
User Action
    ↓
React Component (UI)
    ↓
Event Handler (onClick, onSubmit)
    ↓
Client-Side Validation
    ↓
Firebase API Call
    ↓
Firebase (Storage / Firestore)
    ↓
Success/Error Response
    ↓
Update UI (Toast, Redirect)
```

**Example: Submitting a Project**

```
1. User fills form → `components/ProjectSubmissionForm.tsx` on `/hackathon/profile`
2. User clicks Submit → handleSubmit()
3. Validate form data → if (!valid) return error
4. Upload screenshots → Firebase Storage API
5. Get image URLs → getDownloadURL()
6. Save to database → Firestore API
7. Show success toast → useToast()
8. Redirect to gallery → router.push('/gallery')
```

---

## 🔧 Technical Stack Summary

| Feature | Technology | Why We Use It |
|---------|-----------|---------------|
| **UI Components** | React + shadcn/ui | Pre-built, beautiful components |
| **Routing** | Next.js App Router | File-based routing (easy!) |
| **Styling** | Tailwind CSS | Fast, utility-first styling |
| **Authentication** | Firebase Auth | Email/password + Google; roles in Firestore |
| **Database** | Firestore | Real-time, NoSQL database |
| **File Storage** | Firebase Storage | Store images in the cloud |
| **Forms** | React Hooks | `useState`, `useForm` |
| **Type Safety** | TypeScript | Catch errors early |

---

## 💡 Key Takeaways

1. **Firebase Auth** signs users in; **Firestore** stores profiles and roles
2. **Firebase** stores project data (Firestore) + files (Storage); privileged writes via **Cloud Functions**
3. **Next.js makes routing easy** - One folder = one page
4. **Components are reusable** - Build once, use everywhere
5. **Security is multi-layered** - Client + Server checks
6. **Everything is typed** - TypeScript prevents bugs

---

## 📚 Next Steps

- **Learn how it's built**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **Become an admin**: [DEPLOYMENT.md](DEPLOYMENT.md) Step 4
- **Deploy it**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Questions? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open the browser console (F12) to see what's happening!**

