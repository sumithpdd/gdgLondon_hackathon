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
  /** Legacy rows in the active collection before `hackathonId` was stamped on every save. */
  return true;
}

/** Shown on /hackathon/ideas — submitted (or recruiting draft) for the current event. */
export function isIdeaGalleryProject(project: Submission): boolean {
  if (project.place) return false;
  if (!belongsToActiveHackathon(project)) return false;
  if (project.status === "submitted") return true;
  if (project.status === "draft" && project.lookingForMembers === true) return true;
  return false;
}

/** @deprecated Use isIdeaGalleryProject — kept for imports that mean “recruiting only”. */
export function isCurrentIdeaGalleryProject(project: Submission): boolean {
  return isIdeaGalleryProject(project) && project.lookingForMembers === true;
}

export function sortIdeasGalleryProjects<T extends Submission>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aRecruit = a.lookingForMembers === true ? 1 : 0;
    const bRecruit = b.lookingForMembers === true ? 1 : 0;
    if (bRecruit !== aRecruit) return bRecruit - aRecruit;
    const at = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return bt - at;
  });
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
