# Features Guide

Complete overview of all features in the Devfest Competition Form.

---

## 🔐 Authentication (Clerk)

**What**: Secure user authentication system

**Features**:
- Email/password sign-up and sign-in
- Social login (Google, GitHub)
- Session management (automatic)
- Protected routes

**Pages**:
- Sign-in modal (click "Sign In" button)
- Automatic redirect after login
- User profile access via avatar

**For Developers**:
```typescript
import { useUser } from "@clerk/nextjs";

const { user } = useUser();
// Access: user.id, user.fullName, user.emailAddresses
```

---

## 💾 Draft System

**What**: Save incomplete forms and resume later

**How It Works**:
1. Fill partial form
2. Click "Save Draft" button
3. Come back anytime
4. Form auto-loads your draft
5. Continue editing or submit

**Features**:
- Auto-load existing draft on page load
- Update draft multiple times
- Separate "draft" vs "submitted" status
- Only submitted items show in public gallery

**User Experience**:
- Toast notification: "Draft Saved"
- Shows existing screenshots separately
- Can add/remove screenshots
- Two buttons: "Save Draft" | "Submit Project"

**Technical**:
```typescript
// Location: app/submit/page.tsx
status: "draft" | "submitted"
updatedAt: timestamp
```

---

## 📸 Multi-file Upload

**What**: Upload 1-5 screenshots per submission

**Features**:
- Click to upload or drag-drop
- Preview images before submit
- Remove unwanted images
- Edit existing submissions
- Separate "Existing" vs "New" screenshots

**Limits**:
- Maximum: 5 images
- Max size: 10 MB per image
- Types: JPG, PNG, GIF, WebP

**User Flow**:
1. Click upload area
2. Select 1-5 images
3. Preview shows below
4. Click X to remove
5. Upload on save/submit

**Technical**:
```typescript
// Validation: lib/validators.ts
validateImageFile(file: File)
// Upload: Firebase Storage
screenshots: string[] // URLs
```

---

## 🏆 Winner Selection

**What**: Admin can select 1st, 2nd, 3rd place winners

**Admin Features**:
- View all submissions
- Dropdown to select place
- Remove winner designation
- See current winners at top
- Winner badges in gallery

**Winner Places**:
- 🥇 1st Place
- 🥈 2nd Place  
- 🥉 3rd Place

**How To Use**:
1. Login to `/admin/login`
2. Username: `admin`, Password: `admin`
3. Scroll to submission
4. Select place from dropdown
5. Changes save automatically

**Gallery Display**:
- Winners show badges
- Highlighted in gallery
- Special positioning (can be added)

**Technical**:
```typescript
place: "first" | "second" | "third" | null
// Update: updateDoc(doc, { place })
```

---

## 🎯 Interests & Tags

**What**: Add interests as removable tags

**Features**:
- Add unlimited interests (recommended max 10)
- Type and press Enter or click Add
- Display as colored badges
- Click X to remove
- Shown in gallery and admin

**Example Interests**:
- AI, Machine Learning
- Web Development
- Data Science
- IoT, Blockchain
- Cybersecurity

**User Experience**:
```
[Input: "Machine Learning"] [+ Add]

Added tags:
[AI ×] [Machine Learning ×] [Web Dev ×]
```

**Technical**:
```typescript
interests: string[] // Array of tags
// Max per interest: 50 chars
// Recommended limit: 10 interests
```

---

## 🔗 Social Links

**What**: Multiple social profile links with icons

**Supported Platforms**:
- 🔗 LinkedIn
- 🐦 Twitter
- 📘 Facebook
- 📷 Instagram
- 🌐 Website
- 💻 GitHub (required)

**Features**:
- Individual input per platform
- Colored icon circles
- All optional except GitHub
- URL validation
- Display in gallery with icons

**User Experience**:
```
🔗 [LinkedIn URL input]
🐦 [Twitter URL input]
📘 [Facebook URL input]
...
```

**Technical**:
```typescript
// All optional except githubUrl
linkedinUrl?: string
twitterUrl?: string
facebookUrl?: string
instagramUrl?: string
websiteUrl?: string
githubUrl: string // Required
```

---

## 🎨 Dark Mode UI

**What**: Beautiful dark theme by default

**Features**:
- Dark mode always on
- Gradient backgrounds
- Poppins font family
- Slate color palette
- Glassmorphic effects

**Colors**:
- Background: Slate 950-800 gradient
- Cards: Slate 900/50 transparent
- Text: White/Slate 300
- Accents: Blue, Purple, Amber

**Typography**:
- Font: Poppins (Google Fonts)
- Weights: 300, 400, 500, 600, 700
- Applied globally

**Technical**:
```typescript
// app/layout.tsx
<ThemeProvider
  defaultTheme="dark"
  enableSystem={false}
/>
```

---

## 📱 Responsive Design

**What**: Works on all devices

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Features**:
- Mobile-first approach
- Touch-friendly buttons
- Responsive grids
- Collapsible menus
- Adaptive images

**Tested On**:
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Desktop browsers

---

## 🖼️ Screenshot Preview (Admin)

**What**: Full-screen image preview in modal

**Features**:
- Click thumbnail to open
- Full-size preview
- Navigation arrows (← →)
- Thumbnail strip below
- Image counter (e.g., "3 / 5")
- Keyboard navigation

**User Experience**:
1. Click any screenshot
2. Modal opens full-size
3. Use arrows to navigate
4. Click thumbnails to jump
5. Click outside to close

**Technical**:
```typescript
// Components: Dialog from shadcn/ui
// Location: app/admin/page.tsx
openScreenshotDialog(screenshots, index)
```

---

## ⚡ Error Handling

**What**: Graceful error management

**Features**:
- Global error boundary
- Friendly error messages
- "Try again" buttons
- Return to home option
- Error logging

**Error Pages**:
- `app/error.tsx` - Catches errors
- `app/not-found.tsx` - 404 page
- `app/loading.tsx` - Loading state

**User Experience**:
```
Something went wrong!
[Try again] [Go home]
```

---

## 🔄 Loading States

**What**: Loading indicators throughout

**Features**:
- Global loading page
- Button loading states
- Spinner animations
- "Loading..." text
- Disabled buttons while loading

**Examples**:
```typescript
{loading ? (
  <>
    <Loader2 className="animate-spin" />
    Submitting...
  </>
) : (
  "Submit Project"
)}
```

---

## ✅ Input Validation

**What**: Validate user input

**Features**:
- File type validation
- File size limits
- URL validation
- GitHub URL specific check
- Email format check
- Required field validation

**Validators**:
```typescript
// lib/validators.ts
validateImageFile(file) // Check type & size
validateUrl(url)        // Valid URL format
validateGitHubUrl(url)  // GitHub specific
validateSubmissionForm(data) // All fields
sanitizeString(str)     // Clean input
```

**Limits**:
```typescript
// lib/constants.ts
MAX_SCREENSHOTS = 5
MAX_FILE_SIZE_MB = 10
fullName: { min: 2, max: 100 }
appPurpose: { min: 10, max: 2000 }
```

---

## 🔥 Firebase Integration

**What**: Backend database and storage

**Services**:
- **Firestore**: Store submission data
- **Storage**: Store images

**Collections**: `projects` (submissions), `users` (profiles)

**Features**:
- Real-time updates
- Automatic timestamps
- Security rules
- CDN image delivery
- Query ordering

**Security**:
```javascript
// Read: Anyone
// Write: Authenticated users only
// File size: Max 10MB
```

---

## 🔒 Admin Authentication

**What**: Session-based admin access

**Credentials** (Demo):
- Username: `admin`
- Password: `admin`
- Session: 24 hours

**Features**:
- Login page: `/admin/login`
- Session storage
- Auto logout after 24h
- Protected admin routes

**For Production**:
Change credentials in `lib/constants.ts`:
```typescript
export const ADMIN_CREDENTIALS = {
  username: 'your_username',
  password: 'your_secure_password',
}
```

---

## 📊 Admin Dashboard

**What**: Manage all submissions

**Features**:
- View all submissions (drafts + submitted)
- See user information
- Preview screenshots
- Select winners
- Access social links
- Filter by status
- Sort by date

**Information Shown**:
- Full name, email
- Project description
- Interests tags
- All social links
- Screenshots gallery
- Created/updated dates
- User ID
- Draft/submitted status

---

## 🎯 Gallery View

**What**: Public display of submissions

**Features**:
- Grid layout
- Winner badges
- Screenshot preview
- Interests display
- Social link icons
- Responsive cards
- Hover effects

**Filtering**:
- Shows only "submitted" (not drafts)
- Sorted by newest first
- Can add search (future)

---

## Configuration & Constants

**Central Config**: `lib/constants.ts`

**Key Values**:
```typescript
PROJECTS_COLLECTION = 'hackatonProjects'
USERS_COLLECTION = 'hackatonUsers'
MAX_SCREENSHOTS = 5
MAX_FILE_SIZE_MB = 10
ADMIN_SESSION_DURATION_HOURS = 24
MAX_INTERESTS = 10

FORM_LIMITS = {
  fullName: { min: 2, max: 100 }
  appPurpose: { min: 10, max: 2000 }
  // ... more
}
```

**Why Useful**:
- Single source of truth
- Easy to modify
- Consistent across app
- Type-safe

---

## Best Practices Implemented

### Code Quality
- ✅ TypeScript for type safety
- ✅ Centralized constants
- ✅ Input validation
- ✅ Error boundaries
- ✅ Loading states
- ✅ Proper comments

### Security
- ✅ Environment variables
- ✅ Firebase security rules
- ✅ Authentication required
- ✅ Input sanitization
- ✅ No exposed keys

### User Experience
- ✅ Loading indicators
- ✅ Error messages
- ✅ Toast notifications
- ✅ Form auto-save
- ✅ Preview features

### Performance
- ✅ Image optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ CDN delivery

---

## Quick Reference

### For Users
- **Submit**: `/submit` - Create submission
- **Gallery**: `/gallery` - View projects
- **Admin**: `/admin/login` - Manage (admin only)

### For Developers
- **Constants**: `lib/constants.ts`
- **Validators**: `lib/validators.ts`
- **Firebase**: `lib/firebase.ts`
- **Types**: `types/submission.ts`

### For Production
1. Change admin credentials
2. Review security settings
3. Test all features
4. Deploy to Vercel

---

**Need more details?** See TROUBLESHOOTING.md and FIREBASE_SETUP.md.

