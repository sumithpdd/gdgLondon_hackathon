/**
 * Hackathon HTTPS callable names — must match exports in functions/src/index.ts
 * and every httpsCallable(..., "name") in the Next.js app.
 */
export const HACKATHON_CALLABLES = [
  "setWinnerPlace",
  "announceWinners",
  "createProject",
  "ensureUserProfile",
  "adminLookupUserByEmail",
  "adminProvisionHackathonUser",
  "updateCheckInConfig",
  "generateCheckInCode",
  "selfCheckInWithCode",
  "staffCheckInUser",
  "resetUserAttendance",
  "createJoinRequest",
  "handleJoinRequest",
  "setUserRole",
  "adminUpdateUser",
  "adminSetUserDeleted",
  "deleteArchivedProject",
  "deleteProject",
  "resetHackathon",
  "castVotes",
  "refreshLiveStats",
  "assignWinnersFromVotes",
  "reserveEventPhotoUpload",
  "finalizeEventPhotoUpload",
  "withdrawEventPhoto",
] as const;

export type HackathonCallable = (typeof HACKATHON_CALLABLES)[number];

/** Gen-1 functions from the photobooth / DevFest app (separate codebase). */
export const LEGACY_CALLABLES = [
  "processPhotoWithGemini",
  "seedBackgrounds",
  "sendEmail",
] as const;

export const LEGACY_HTTP = ["healthCheck"] as const;

export const LEGACY_FIRESTORE_TRIGGERS = ["cleanupPhotoStorage"] as const;
