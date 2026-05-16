# Firestore Data Model

**GDG London Hackathon** — live data uses `io2026Hackathon_*` when `NEXT_PUBLIC_HACKATHON_DATASET=io2026`, otherwise legacy `hackaton*`. Archived IWD 2026 data: `iwd2026Hackathon_*`. **Buddies** uses `io2026Hackathon_buddyRequests` (or legacy `hackatonBuddyRequests`) when the active dataset is wired in `lib/hackathon-collections.ts`. See [IO2026_HACKATHON_SPEC.md](./IO2026_HACKATHON_SPEC.md) and `lib/constants.ts`.

---

## Collections overview

| Purpose | Notes |
|---------|-------|
| User profiles and roles | admin, moderator, user; optional **Buddies** / extended profile fields (directory opt-in, tags, links) |
| Buddy requests | Pending / accepted / declined between users (active collection from `BUDDY_REQUESTS_COLLECTION`) |
| Project submissions | Hackathon projects with engagement data |
| Tag libraries | Interests, Expertise, TechStack |
| Project comments | Subcollection under each project |
| User bookmarks | Subcollection under each user |
| Community discussions | Forum-style posts |
| Hackathon updates | Admin announcements |

**Security note:** Collection names and storage paths are defined in `lib/constants.ts` (from `getActiveCollections()`). Do not expose raw collection names in public-facing UI.

---

## User profiles

User profiles are created on first sign-in. Document ID = Firebase Auth UID.

```typescript
{
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "admin" | "moderator" | "user";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Buddies / extended profile (optional) — see BUDDIES_FEATURE_LABEL routes in IO spec
  hackathonBio?: string;
  hackathonLinkedinUrl?: string;
  profileDisplayName?: string;
  city?: string;
  country?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  programmingSkills?: string[];
  domainExpertise?: string[];
  wantToLearnTags?: string[];
  canOfferTags?: string[];
  githubUrl?: string;
  websiteUrl?: string;
  buddiesVisibleInDirectory?: boolean;
  skills?: string[];
  interests?: string[];
  teamPreference?: string; // e.g. "solo" | "team" | "flexible"
  inPersonAttendance?: boolean | null; // null = "unsure"
  profileCompletionPercent?: number;
}
```

**To set admin:** Firestore Console → active **users** collection (see `USERS_COLLECTION` in `lib/constants.ts`) → set `role` to `"admin"`.

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

All collection names and storage paths are centralized in `lib/constants.ts` (backed by `lib/hackathon-collections.ts`). Reference those files in code; avoid hardcoding collection strings.

---

## Migration & datasets

- **Archive:** `npm run migrate:iwd-archive` — copies legacy `hackaton*` → `iwd2026Hackathon_*` (see IO 2026 spec).
- **Switching live dataset:** set `NEXT_PUBLIC_HACKATHON_DATASET=io2026` only after rules, Functions env, and admin user docs are aligned with `io2026Hackathon_*`.
