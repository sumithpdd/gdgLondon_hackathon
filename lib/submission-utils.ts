/**
 * Submission display helpers - normalizes legacy and new hackathon format
 */
import { Submission } from "@/types/submission";

export function getProjectTitle(sub: Submission): string {
  return sub.projectTitle || sub.fullName || "Untitled Project";
}

export function getTeamName(sub: Submission): string {
  return sub.teamName || sub.fullName || "Solo";
}

export function getShortDescription(sub: Submission, maxLength = 120): string {
  const desc = sub.appPurpose || "";
  if (desc.length <= maxLength) return desc;
  return desc.slice(0, maxLength).trim() + "...";
}
