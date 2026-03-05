# 🎯 App Features (Simple Explanation)

This document explains what the app can do and how each feature works.

---

## 👤 For Regular Users

### 1. Sign Up / Sign In 🔐

**What it does**: Creates an account or logs you in  
**How it works**: Uses Clerk (not built by us!)

**Steps**:
1. Click "Sign In" button
2. Modal (popup) appears
3. Enter email or use Google/GitHub
4. Receive verification code via email
5. Enter code
6. You're logged in!

**Behind the scenes**:
- Clerk stores your account securely
- Your info is saved to their database
- We get your name and email from Clerk

**Files involved**:
- `app/page.tsx` - Has the Sign In button
- Clerk handles everything else!

---

### 2. Submit a Project 📤

**What it does**: Lets you share your AI project  
**How it works**: Form that saves to Firebase

**Steps**:
1. Click "Submit Your Project" from home
2. Fill in:
   - Your name (auto-filled from Clerk)
   - Email (auto-filled)
   - GitHub URL
   - Project description
   - Upload screenshots (1-5 images)
   - Optional: Social media links
   - Optional: Interest tags (AI, ML, etc.)
3. Click "Submit for Review" or "Save as Draft"

**What happens**:
```
Fill Form → Upload Images to Firebase Storage → Save Data to Firestore
```

**Behind the scenes**:
- Images uploaded one by one to Firebase Storage
- Each image gets a unique URL
- All info saved to Firestore collection `hackatonProjects`
- Submission linked to your Clerk user ID

**Files involved**:
- `app/submit/page.tsx` - The form
- `lib/firebase.ts` - Connects to Firebase

**Important Code**:
```typescript
// Upload image to Firebase Storage
const storageRef = ref(storage, `hackathon_uploads/${filename}`)
await uploadBytes(storageRef, file)
const url = await getDownloadURL(storageRef)

// Save submission to Firestore
await addDoc(collection(db, "projects"), {
  fullName: "Your Name",
  email: "your@email.com",
  screenshots: [url1, url2, url3],
  status: "submitted",
  createdAt: new Date()
})
```

---

### 3. Save as Draft 💾

**What it does**: Saves incomplete submissions  
**How it works**: Same as submit but with `status: "draft"`

**Why it's useful**:
- Come back later to finish
- Don't lose your work
- Can upload more screenshots later

**Behind the scenes**:
- Checks if you have an existing draft (by user ID)
- Updates existing draft or creates new one
- Marked as `status: "draft"` (not visible in gallery)

**Files involved**:
- `app/submit/page.tsx` - Has "Save as Draft" button

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
**How it works**: Updates user metadata in Clerk

**Steps**:
1. Go to `/admin`
2. Click "Manage User Roles"
3. Search for user by name or email
4. Click "Make Admin" or "Make Moderator"
5. User must log out/in to see change

**Behind the scenes**:
```typescript
// Server action that runs on server
export async function setRole(formData: FormData) {
  // Verify current user is admin
  if (!(await checkRole('admin'))) {
    return { message: 'Not Authorized' }
  }
  
  // Update user metadata in Clerk
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role: "admin" }
  })
}
```

**Roles explained**:
- **Admin**: Can do everything
- **Moderator**: Can view, can't edit
- **User**: Standard permissions

**Files involved**:
- `app/admin/users/page.tsx` - User search page
- `app/admin/_actions.ts` - Server actions
- `utils/roles.ts` - Role checking

---

## 🎨 UI Features

### 9. Role Badges 🏷️

**What it does**: Shows your role in the header  
**How it works**: Reads from Clerk metadata

**Displays**:
- 🛡️ **Admin** - Red badge + "Admin Panel" button
- ⚙️ **Moderator** - Blue badge + "View Panel" button
- 👤 **User** - Gray badge (no button)

**Code**:
```typescript
// Get role from Clerk
const role = user.publicMetadata.role || 'user'

// Show appropriate badge
{role === 'admin' && <Badge>Admin</Badge>}
```

**Files involved**:
- `components/UserNav.tsx` - Role badge component

---

### 10. Photo Gallery Viewer 📸

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

### 11. Access Control 🚪

**What it does**: Ensures only authorized users access certain pages  
**How it works**: Checks roles before showing content

**Protected Routes**:
```
/submit       → Must be signed in (Clerk)
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
1. **Clerk Middleware** - Checks if signed in
2. **Client Component** - Shows/hides UI
3. **Server Component** - Redirects unauthorized users
4. **Server Actions** - Validates before database changes

---

### 12. Form Validation ✅

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
- `app/submit/page.tsx` - Has validation

---

## 🎨 Styling Features

### 13. Responsive Design 📱

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

### 14. Loading States ⏳

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

### 15. Toast Notifications 🔔

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
1. User fills form → app/submit/page.tsx
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
| **Authentication** | Clerk | No need to build login ourselves |
| **Database** | Firestore | Real-time, NoSQL database |
| **File Storage** | Firebase Storage | Store images in the cloud |
| **Forms** | React Hooks | `useState`, `useForm` |
| **Type Safety** | TypeScript | Catch errors early |

---

## 💡 Key Takeaways

1. **Clerk handles all auth** - We just use their components
2. **Firebase stores everything** - Firestore (data) + Storage (files)
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

