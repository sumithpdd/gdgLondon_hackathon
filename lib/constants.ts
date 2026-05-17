/**
 * Application Constants
 *
 * Firestore collection names follow getActiveCollections() — see lib/hackathon-collections.ts
 * Set NEXT_PUBLIC_HACKATHON_DATASET=io2026 for the new IO 2026 collections (empty until populated).
 */

import { getActiveCollections, HACKATHON_BRAND_NAME } from "./hackathon-collections";

const c = getActiveCollections();

export const HACKATHON_DISPLAY_NAME = HACKATHON_BRAND_NAME;

/** Live hackathon edition (IO 2026) — hub hero, footer, metadata. Archive: /past-projects (IWD 2026). */
export const HACKATHON_EVENT_TAGLINE = "Build with AI × Google I/O 2026 — GDG London";
export const HACKATHON_EVENT_SHORT = "Google I/O 2026";

/** Default event blurb stored on `hackathons/{activeId}` (Build with AI program). */
export const BUILD_WITH_AI_EVENT_DESCRIPTION =
  "Build with AI are community-led technical workshops and hackathons hosted by GDGs and GDG on Campus. Use any AI technology—from open models to cloud APIs—to build something real. Google tools like Gemini and AI Studio are optional.";

/** Logged-in networking: directory, requests, accepted buddies (not the overall event title). */
export const BUDDIES_FEATURE_LABEL = "Buddies";

export const HACKATHONS_COLLECTION = "hackathons";

// Firebase collections (active hackathon)
export const PROJECTS_COLLECTION = c.projects;
export const USERS_COLLECTION = c.users;
export const JOIN_REQUESTS_COLLECTION = c.joinRequests;
export const VOTES_COLLECTION = c.votes;
export const ATTENDANCE_COLLECTION = c.attendance;
export const WINNERS_COLLECTION = c.winners;
export const SETTINGS_COLLECTION = c.settingsCollection;
export const SETTINGS_DOC_ID = c.settingsDocId;
export const LIVE_STATS_COLLECTION = c.liveStats ?? "io2026Hackathon_liveStats";
export const LIVE_STATS_DOC_ID = "summary";
export const LIVE_SLIDE_DOC_ID = "liveSlide";
/** Public check-in window flags (no code — validated server-side). */
export const CHECKIN_PUBLIC_DOC_ID = "checkInPublic";

export const FIREBASE_STORAGE_FOLDER = "hackathon_uploads";
export const COMMENTS_SUBCOLLECTION = "comments";
export const BOOKMARKS_SUBCOLLECTION = "bookmarks";
export const DISCUSSIONS_COLLECTION = c.discussions;
export const UPDATES_COLLECTION = c.updates;
export const CREDIT_CLAIMS_COLLECTION = c.creditClaims;
export const BUDDY_REQUESTS_COLLECTION = c.buddyRequests;

/** @deprecated Use PROJECTS_COLLECTION */
export const FIREBASE_COLLECTION = PROJECTS_COLLECTION;

// IO 2026 submission timeline (London)
export const HACKATHON_IDEA_SUBMISSION_OPENS = new Date("2026-05-17T00:00:00+01:00");
export const HACKATHON_SUBMISSION_DEADLINE = new Date("2026-05-19T20:00:00+01:00");
/** @deprecated Use HACKATHON_IDEA_SUBMISSION_OPENS / HACKATHON_SUBMISSION_DEADLINE */
export const HACKATHON_START_DATE = HACKATHON_IDEA_SUBMISSION_OPENS;

export const BUILT_WITH_OPTIONS = [
  "OpenAI",
  "Claude",
  "Gemini",
  "Hugging Face",
  "Firebase",
  "Flutter",
  "Vertex AI",
  "Cloud Run",
] as const;
export const AI_CATEGORIES = ["agents", "ai-apps", "devtools", "ai-for-good", "other"] as const;

export const MAX_SCREENSHOTS = 5;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUBMISSION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  FINALIST: "finalist",
  WINNER: "winner",
} as const;

export const WINNER_PLACES = {
  FIRST: "first",
  SECOND: "second",
  THIRD: "third",
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const TOAST_DURATION = 5000;

/** Audience voting caps (enforced in Cloud Functions `castVotes`). */
export const VOTE_BUDGET_ORGANISER = 10;
export const VOTE_BUDGET_PARTICIPANT = 5;
export const VOTE_MAX_PER_PROJECT = 2;

export const FORM_LIMITS = {
  fullName: { min: 2, max: 100 },
  email: { max: 100 },
  githubUrl: { max: 200 },
  appPurpose: { min: 10, max: 2000 },
  linkedinUrl: { max: 200 },
  twitterUrl: { max: 200 },
  facebookUrl: { max: 200 },
  instagramUrl: { max: 200 },
  websiteUrl: { max: 200 },
  interest: { max: 50 },
  maxInterests: 10,
};
