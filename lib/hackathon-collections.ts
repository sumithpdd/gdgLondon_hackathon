/**
 * Multi-hackathon Firestore collection naming.
 *
 * - io2026Hackathon_* — live IO 2026 hackathon (all active app collections when NEXT_PUBLIC_HACKATHON_DATASET=io2026)
 * - iwd2026Hackathon_* — archived IWD / prior data (after migration from legacy hackaton*)
 * - Legacy hackaton* — unchanged until you migrate and flip NEXT_PUBLIC_HACKATHON_DATASET
 *
 * Set NEXT_PUBLIC_HACKATHON_DATASET=io2026 to point the app at the new collections.
 */

/** Event name for headers, registration, voting, etc. (Networking lives under the “Buddies” area, not in this string.) */
export const HACKATHON_BRAND_NAME = "GDG London Hackathon";

export type HackathonDataset = "legacy" | "io2026";

function dataset(): HackathonDataset {
  // IO 2026 is the live app default. Set NEXT_PUBLIC_HACKATHON_DATASET=legacy only for old hackaton* tooling.
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HACKATHON_DATASET === "legacy") {
    return "legacy";
  }
  return "io2026";
}

/** Archived IWD / pre-IO data (read from /past-projects etc.) */
export const IWD2026_PREFIX = "iwd2026Hackathon" as const;

export const IWD2026_COLLECTIONS = {
  users: `${IWD2026_PREFIX}_users`,
  projects: `${IWD2026_PREFIX}_projects`,
  joinRequests: `${IWD2026_PREFIX}_joinRequests`,
  votes: `${IWD2026_PREFIX}_votes`,
  attendance: `${IWD2026_PREFIX}_attendance`,
  settings: `${IWD2026_PREFIX}_settings`,
  winners: `${IWD2026_PREFIX}_winners`,
  discussions: `${IWD2026_PREFIX}_discussions`,
  updates: `${IWD2026_PREFIX}_updates`,
  creditClaims: `${IWD2026_PREFIX}_creditClaims`,
  buddyRequests: `${IWD2026_PREFIX}_buddyRequests`,
} as const;

/** Live IO 2026 hackathon */
export const IO2026_PREFIX = "io2026Hackathon" as const;

export const IO2026_COLLECTIONS = {
  users: `${IO2026_PREFIX}_users`,
  projects: `${IO2026_PREFIX}_projects`,
  joinRequests: `${IO2026_PREFIX}_joinRequests`,
  votes: `${IO2026_PREFIX}_votes`,
  attendance: `${IO2026_PREFIX}_attendance`,
  settings: `${IO2026_PREFIX}_settings`,
  winners: `${IO2026_PREFIX}_winners`,
  discussions: `${IO2026_PREFIX}_discussions`,
  updates: `${IO2026_PREFIX}_updates`,
  creditClaims: `${IO2026_PREFIX}_creditClaims`,
  buddyRequests: `${IO2026_PREFIX}_buddyRequests`,
  liveStats: `${IO2026_PREFIX}_liveStats`,
  eventPhotos: `${IO2026_PREFIX}_eventPhotos`,
} as const;

/** Pre-migration collection names (GDG London hackathon v1) */
export const LEGACY_COLLECTIONS = {
  users: "hackatonUsers",
  projects: "hackatonProjects",
  joinRequests: "hackatonJoinRequests",
  config: "hackatonConfig",
  creditClaims: "hackatonCreditClaims",
  discussions: "hackatonDiscussions",
  updates: "hackatonUpdates",
  /** Live legacy voting / attendance / winners (parallel to io2026Hackathon_*); not used until features ship */
  votes: "hackatonVotes",
  attendance: "hackatonAttendance",
  winners: "hackatonWinners",
  buddyRequests: "hackatonBuddyRequests",
} as const;

export function getActiveDataset(): HackathonDataset {
  return dataset();
}

/** Active hackathon collections used by the running app */
export function getActiveCollections() {
  if (dataset() === "io2026") {
    return {
      users: IO2026_COLLECTIONS.users,
      projects: IO2026_COLLECTIONS.projects,
      joinRequests: IO2026_COLLECTIONS.joinRequests,
      votes: IO2026_COLLECTIONS.votes,
      attendance: IO2026_COLLECTIONS.attendance,
      winners: IO2026_COLLECTIONS.winners,
      settingsCollection: IO2026_COLLECTIONS.settings,
      settingsDocId: "main",
      creditClaims: IO2026_COLLECTIONS.creditClaims,
      discussions: IO2026_COLLECTIONS.discussions,
      updates: IO2026_COLLECTIONS.updates,
      buddyRequests: IO2026_COLLECTIONS.buddyRequests,
      eventPhotos: IO2026_COLLECTIONS.eventPhotos,
    };
  }
  return {
    users: LEGACY_COLLECTIONS.users,
    projects: LEGACY_COLLECTIONS.projects,
    joinRequests: LEGACY_COLLECTIONS.joinRequests,
    votes: LEGACY_COLLECTIONS.votes,
    attendance: LEGACY_COLLECTIONS.attendance,
    winners: LEGACY_COLLECTIONS.winners,
    settingsCollection: LEGACY_COLLECTIONS.config,
    settingsDocId: "settings",
    creditClaims: LEGACY_COLLECTIONS.creditClaims,
    discussions: LEGACY_COLLECTIONS.discussions,
    updates: LEGACY_COLLECTIONS.updates,
    buddyRequests: LEGACY_COLLECTIONS.buddyRequests,
    liveStats: "hackatonLiveStats",
    eventPhotos: "hackatonEventPhotos",
  };
}
