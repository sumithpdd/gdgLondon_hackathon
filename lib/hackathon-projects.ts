import type { Submission } from "@/types/submission";
import { getActiveHackathonId } from "./active-hackathon";

/** Project belongs to the live hackathon edition (not another registry id). */
export function belongsToActiveHackathon(project: {
  hackathonId?: string;
  hackathonName?: string;
}): boolean {
  const activeId = getActiveHackathonId();
  const id = project.hackathonId?.trim();
  if (id) return id === activeId;
  return false;
}

/** Shown on /hackathon/ideas — recruiting teams for the current event only. */
export function isCurrentIdeaGalleryProject(project: Submission): boolean {
  return (
    project.lookingForMembers === true &&
    belongsToActiveHackathon(project) &&
    !project.place
  );
}

export function isArchivedIdeaProject(project: { lookingForMembers?: boolean }): boolean {
  return project.lookingForMembers === true;
}

const PLACE_ORDER: Record<string, number> = { first: 0, second: 1, third: 2 };

export function sortByWinnerPlace<T extends { place?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.place ? PLACE_ORDER[a.place] ?? 99 : 99;
    const bo = b.place ? PLACE_ORDER[b.place] ?? 99 : 99;
    return ao - bo;
  });
}

export function projectsWithWinnerPlace<T extends { place?: string | null }>(items: T[]): T[] {
  return items.filter((p) => p.place === "first" || p.place === "second" || p.place === "third");
}
