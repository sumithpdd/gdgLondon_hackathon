/**
 * Idea gallery filters, labels, and display helpers for /hackathon/ideas.
 */
import type { AICategory, ProjectStage, Submission } from "@/types/submission";
import { AI_CATEGORIES } from "@/lib/constants";
import { getProjectTitle, getShortDescription } from "@/lib/submission-utils";

export const AI_CATEGORY_LABELS: Record<AICategory, string> = {
  agents: "Agents",
  "ai-apps": "AI Apps",
  devtools: "DevTools",
  "ai-for-good": "AI for Good",
  other: "Other",
};

export const IDEA_CATEGORY_FILTERS: { id: "all" | AICategory; label: string }[] = [
  { id: "all", label: "ALL" },
  ...AI_CATEGORIES.map((id) => ({ id, label: AI_CATEGORY_LABELS[id].toUpperCase() })),
];

export const RECRUITMENT_TAG_OPTIONS = [
  "Co-Founder",
  "Teammates",
  "Beta Testers",
  "Feedback",
  "Design Partner",
  "Engineers",
] as const;

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  building: "BUILDING",
  mvp: "MVP",
  live: "LIVE",
};

export function getPitchLine(sub: Submission, maxLength = 120): string {
  const line = (sub.pitchLine || "").trim();
  if (line) return line.length <= maxLength ? line : line.slice(0, maxLength).trim() + "…";
  return getShortDescription(sub, maxLength);
}

export function getProjectStage(sub: Submission): ProjectStage {
  if (sub.projectStage) return sub.projectStage;
  if (sub.status === "submitted" || sub.status === "finalist" || sub.status === "winner") {
    return "live";
  }
  return "building";
}

export function getCategoryLabel(sub: Submission): string {
  if (sub.aiCategory) return AI_CATEGORY_LABELS[sub.aiCategory];
  return "Other";
}

/** Tags shown in the OPEN ASKS row on gallery cards. */
export function getOpenAsks(sub: Submission): string[] {
  if (sub.recruitmentTags?.length) return sub.recruitmentTags;
  const asks: string[] = [];
  if (sub.lookingForMembers) asks.push("Teammates");
  if (sub.projectType === "solo") asks.push("Co-Founder");
  return asks.length ? asks : ["Teammates"];
}

export function getFounderName(sub: Submission): string {
  return (sub.fullName || sub.teamName || "Founder").trim();
}

export function matchesCategoryFilter(sub: Submission, categoryId: string): boolean {
  if (categoryId === "all") return true;
  if (!sub.aiCategory) return categoryId === "other";
  return sub.aiCategory === categoryId;
}

export function matchesRecruitmentFilters(sub: Submission, activeTags: string[]): boolean {
  if (activeTags.length === 0) return true;
  const asks = getOpenAsks(sub).map((t) => t.toLowerCase());
  return activeTags.some((tag) => {
    const needle = tag.toLowerCase();
    return asks.some((a) => a.includes(needle) || needle.includes(a));
  });
}

export function matchesIdeaSearch(sub: Submission, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    getProjectTitle(sub),
    sub.teamName,
    sub.appPurpose,
    sub.pitchLine,
    sub.hackathonName,
    ...(sub.builtWith || []),
    ...(sub.recruitmentTags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterIdeaGalleryProjects(
  projects: Submission[],
  opts: { categoryId: string; recruitmentTags: string[]; searchQuery: string }
): Submission[] {
  return projects.filter(
    (s) =>
      matchesCategoryFilter(s, opts.categoryId) &&
      matchesRecruitmentFilters(s, opts.recruitmentTags) &&
      matchesIdeaSearch(s, opts.searchQuery)
  );
}
