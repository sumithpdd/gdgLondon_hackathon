# Firestore Data Model

Build with AI Hackathon — IWD London 2026

---

## Collections Overview

| Purpose | Notes |
|---------|-------|
| User profiles and roles | admin, moderator, user |
| Project submissions | Hackathon projects with engagement data |
| Tag libraries | Interests, Expertise, TechStack |
| Project comments | Subcollection under each project |
| User bookmarks | Subcollection under each user |
| Community discussions | Forum-style posts |
| Hackathon updates | Admin announcements |

**Security note:** Collection names and storage paths are defined in `lib/constants.ts`. Do not expose these values in public documentation or client-facing content.

---

## User Profiles

User profiles created on first sign-in. Document ID = Firebase Auth UID.

```typescript
{
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "admin" | "moderator" | "user";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**To set admin:** Firestore Console → users collection → select user doc → set `role` to `"admin"`

---

## Project Submissions

Hackathon project submissions. Created when user submits a project.

```typescript
{
  // Required
  projectTitle: string;
  teamName: string;
  projectType: "solo" | "team";
  appPurpose: string;        // Problem → Solution → Impact
  demoVideoUrl: string;      // YouTube (max 3 min)
  githubUrl: string;
  fullName: string;
  email: string;
  userId: string;
  userEmail: string;
  createdAt: Timestamp;
  status: "draft" | "submitted";

  // Optional
  teamMembers?: { name: string; linkedinUrl?: string }[];
  screenshots?: string[];
  builtWith?: string[];      // Gemini, Firebase, Flutter, etc.
  aiCategory?: string;
  aiToolsUsed?: string[];
  pitchFinalist?: boolean;
  label?: "winner" | "finalist" | "featured";
  place?: "first" | "second" | "third";

  // Engagement
  likes?: number;
  views?: number;
  likesBy?: string[];
  commentCount?: number;

  // Legacy / social
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  interests?: string[];
  expertise?: string[];
  techStack?: string[];
}
```

---

## Storage

| Purpose |
|---------|
| Project screenshots and images |

Storage path is defined in `lib/constants.ts`. Do not expose in documentation.

---

## Audit Fields

All documents include standard audit fields for tracking:

- **createdBy** – User ID of creator
- **updatedBy** – User ID of last updater
- **createdDate** – When the document was created
- **updatedDate** – When the document was last updated

These are set on every create and update. See `types/audit.ts` for helpers.

---

## Constants

All collection names and storage paths are centralized in `lib/constants.ts`. Reference that file in code; do not duplicate or expose values in docs.
