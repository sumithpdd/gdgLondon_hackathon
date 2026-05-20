/**
 * Application Constants
 *
 * Firestore collection names follow getActiveCollections() — see lib/hackathon-collections.ts
 * Set NEXT_PUBLIC_HACKATHON_DATASET=io2026 for the new IO 2026 collections (empty until populated).
 */

import { getActiveCollections, HACKATHON_BRAND_NAME } from "./hackathon-collections";
import {
  HACKATHON_EVENT_END_DATE,
  HACKATHON_EVENT_START_DATE,
  HACKATHON_IDEA_SUBMISSION_OPENS,
  HACKATHON_START_DATE,
  HACKATHON_SUBMISSION_DEADLINE,
} from "./hackathon-dates";

export {
  HACKATHON_EVENT_END_DATE,
  HACKATHON_EVENT_START_DATE,
  HACKATHON_IDEA_SUBMISSION_OPENS,
  HACKATHON_START_DATE,
  HACKATHON_SUBMISSION_DEADLINE,
};

const c = getActiveCollections();

export const HACKATHON_DISPLAY_NAME = HACKATHON_BRAND_NAME;

/** Google I/O brand mark (header logo + favicon). */
export const HACKATHON_BRAND_LOGO_SRC = "/io-logo.png";

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
/** Hashed 6-digit code — Admin SDK / API only (not client-readable). */
export const CHECKIN_SECRETS_DOC_ID = "checkInSecrets";

export const FIREBASE_STORAGE_FOLDER = "hackathon_uploads";
/** Public event gallery — path: event_photos/{hackathonId}/{fileName} */
export const EVENT_PHOTOS_STORAGE_PREFIX = "event_photos";
export const COMMENTS_SUBCOLLECTION = "comments";
export const BOOKMARKS_SUBCOLLECTION = "bookmarks";
export const DISCUSSIONS_COLLECTION = c.discussions;
export const UPDATES_COLLECTION = c.updates;
export const CREDIT_CLAIMS_COLLECTION = c.creditClaims;
export const BUDDY_REQUESTS_COLLECTION = c.buddyRequests;
export const EVENT_PHOTOS_COLLECTION = c.eventPhotos;

/** Max event photos per attendee (pending + approved combined). Enforced in Cloud Functions. */
export const MAX_EVENT_PHOTOS_PER_ATTENDEE = 10;

/** @deprecated Use PROJECTS_COLLECTION */
export const FIREBASE_COLLECTION = PROJECTS_COLLECTION;

/** Why every Watch Party attendee should register on the hub. */
export const HACKATHON_WATCH_PARTY_REGISTRATION_BULLETS = [
  "Receive swag",
  "Vote for hackathon projects during the live event",
  "Access participation and event details",
] as const;

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

/** Event gallery — short clips (storage-conscious). */
export const MAX_GALLERY_VIDEO_SIZE_MB = 50;
export const MAX_GALLERY_VIDEO_SIZE_BYTES = MAX_GALLERY_VIDEO_SIZE_MB * 1024 * 1024;

export const ALLOWED_GALLERY_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

/** File input accept string for photos + videos. */
export const GALLERY_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";

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
