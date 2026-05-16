/**
 * Logical hackathon instance users join (metadata in `hackathons` collection).
 * Firestore project data still follows NEXT_PUBLIC_HACKATHON_DATASET (io2026 vs legacy).
 */

export function getActiveHackathonId(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_ID?.trim()) {
    return process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_ID.trim();
  }
  return "io2026Hackathon";
}
