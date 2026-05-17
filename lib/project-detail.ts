/**
 * Display helpers for /hackathon/project/[id]
 */
import type { Submission } from "@/types/submission";
import { getPitchLine, getOpenAsks, getProjectStage, getCategoryLabel, PROJECT_STAGE_LABELS } from "@/lib/idea-gallery";

export type ParsedPurpose = {
  about: string;
  problem?: string;
  solution?: string;
};

/** Split appPurpose when authors use Problem:/Solution: sections (common hackathon format). */
export function parseAppPurpose(text: string): ParsedPurpose {
  const raw = (text || "").trim();
  if (!raw) return { about: "" };

  const problemRe =
    /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?problem(?:\*\*)?\s*(?:[:\-—]|→)\s*/i;
  const solutionRe =
    /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?solution(?:\*\*)?\s*(?:[:\-—]|→)\s*/i;
  const impactRe =
    /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?impact(?:\*\*)?\s*(?:[:\-—]|→)\s*/i;

  const problemIdx = raw.search(problemRe);
  const solutionIdx = raw.search(solutionRe);
  const impactIdx = raw.search(impactRe);

  if (problemIdx === -1 && solutionIdx === -1) {
    return { about: raw };
  }

  const sliceSection = (start: number, end: number) =>
    raw
      .slice(start, end < 0 ? undefined : end)
      .replace(
        /^(?:#{1,3}\s*)?(?:\*\*)?(?:problem|solution|impact)(?:\*\*)?\s*(?:[:\-—]|→)\s*/i,
        ""
      )
      .trim();

  let about = "";
  let problem: string | undefined;
  let solution: string | undefined;

  if (problemIdx >= 0) {
    about = raw.slice(0, problemIdx).trim();
    const pEnd = solutionIdx > problemIdx ? solutionIdx : impactIdx > problemIdx ? impactIdx : raw.length;
    problem = sliceSection(problemIdx, pEnd);
  }

  if (solutionIdx >= 0) {
    const sEnd = impactIdx > solutionIdx ? impactIdx : raw.length;
    solution = sliceSection(solutionIdx, sEnd);
    if (!about && problemIdx < 0) {
      about = raw.slice(0, solutionIdx).trim();
    }
  }

  if (!about && !problem && !solution) {
    return { about: raw };
  }

  return { about: about || "", problem, solution };
}

export function getExternalSiteLabel(sub: Submission): string | null {
  const url = sub.websiteUrl?.trim();
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "").toUpperCase();
  } catch {
    return "Website";
  }
}

export function getProjectMetaLine(sub: Submission): string {
  const stage = PROJECT_STAGE_LABELS[getProjectStage(sub)];
  const category = getCategoryLabel(sub);
  const asks = getOpenAsks(sub);
  const askPart = asks.length ? asks.join(", ") : sub.lookingForMembers ? "Open to teammates" : "";
  return [stage, category, askPart].filter(Boolean).join(" · ");
}

export function getTractionSummary(sub: Submission): string | null {
  const parts: string[] = [];
  if (sub.status === "submitted") parts.push("Submitted for judging");
  if (sub.status === "finalist") parts.push("Pitch finalist");
  if (sub.place) parts.push(`${sub.place} place winner`);
  if (sub.lookingForMembers) parts.push("Recruiting teammates");
  const views = sub.views ?? 0;
  if (views > 0) parts.push(`${views} page view${views !== 1 ? "s" : ""}`);
  return parts.length ? parts.join(" · ") : null;
}

export function getPitchLineLong(sub: Submission, max = 200): string {
  return getPitchLine(sub, max);
}
