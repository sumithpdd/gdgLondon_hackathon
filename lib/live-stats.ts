import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import {
  LIVE_STATS_COLLECTION,
  LIVE_STATS_DOC_ID,
  SETTINGS_COLLECTION,
  LIVE_SLIDE_DOC_ID,
} from "./constants";
import { getActiveHackathonId } from "./active-hackathon";

export type LiveTopProject = {
  id: string;
  projectTitle?: string;
  teamName?: string;
  voteTotal: number;
  place?: string | null;
};

export type LiveStatsSummary = {
  hackathonId: string;
  checkInCount: number;
  totalVotesCast: number;
  topProjects: LiveTopProject[];
  updatedAt?: Date;
};

export type LiveSlideMode = "leaderboard" | "pitch" | "welcome";

export type LiveSlideDoc = {
  mode: LiveSlideMode;
  headline: string;
  subheadline?: string;
  currentPitchProjectId?: string | null;
  showTopN: number;
};

export const DEFAULT_LIVE_SLIDE: LiveSlideDoc = {
  mode: "leaderboard",
  headline: "Live voting",
  subheadline: "Top projects by audience votes",
  showTopN: 5,
};

function parseSummary(data: Record<string, unknown>): LiveStatsSummary {
  const topRaw = data.topProjects;
  const topProjects: LiveTopProject[] = [];
  if (Array.isArray(topRaw)) {
    for (const p of topRaw) {
      if (!p || typeof p !== "object") continue;
      const o = p as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      if (!id) continue;
      topProjects.push({
        id,
        projectTitle: typeof o.projectTitle === "string" ? o.projectTitle : undefined,
        teamName: typeof o.teamName === "string" ? o.teamName : undefined,
        voteTotal: Number(o.voteTotal) || 0,
        place: typeof o.place === "string" ? o.place : null,
      });
    }
  }

  return {
    hackathonId: String(data.hackathonId || getActiveHackathonId()),
    checkInCount: Number(data.checkInCount) || 0,
    totalVotesCast: Number(data.totalVotesCast) || 0,
    topProjects,
    updatedAt: data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : undefined,
  };
}

export async function fetchLiveStats(): Promise<LiveStatsSummary | null> {
  const snap = await getDoc(doc(db, LIVE_STATS_COLLECTION, LIVE_STATS_DOC_ID));
  if (!snap.exists()) return null;
  return parseSummary(snap.data() as Record<string, unknown>);
}

export async function fetchLiveSlide(): Promise<LiveSlideDoc> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, LIVE_SLIDE_DOC_ID));
  if (!snap.exists()) return DEFAULT_LIVE_SLIDE;
  const d = snap.data();
  const mode = d.mode as LiveSlideMode;
  return {
    mode: mode === "pitch" || mode === "welcome" ? mode : "leaderboard",
    headline: typeof d.headline === "string" ? d.headline : DEFAULT_LIVE_SLIDE.headline,
    subheadline: typeof d.subheadline === "string" ? d.subheadline : undefined,
    currentPitchProjectId:
      typeof d.currentPitchProjectId === "string" ? d.currentPitchProjectId : null,
    showTopN: typeof d.showTopN === "number" ? Math.min(10, Math.max(3, d.showTopN)) : 5,
  };
}

export function subscribeLiveStats(
  onData: (stats: LiveStatsSummary | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, LIVE_STATS_COLLECTION, LIVE_STATS_DOC_ID), (snap) => {
    if (!snap.exists()) {
      onData(null);
      return;
    }
    onData(parseSummary(snap.data() as Record<string, unknown>));
  });
}

export function subscribeLiveSlide(onData: (slide: LiveSlideDoc) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS_COLLECTION, LIVE_SLIDE_DOC_ID), (snap) => {
    if (!snap.exists()) {
      onData(DEFAULT_LIVE_SLIDE);
      return;
    }
    const d = snap.data();
    const mode = d.mode as LiveSlideMode;
    onData({
      mode: mode === "pitch" || mode === "welcome" ? mode : "leaderboard",
      headline: typeof d.headline === "string" ? d.headline : DEFAULT_LIVE_SLIDE.headline,
      subheadline: typeof d.subheadline === "string" ? d.subheadline : undefined,
      currentPitchProjectId:
        typeof d.currentPitchProjectId === "string" ? d.currentPitchProjectId : null,
      showTopN: typeof d.showTopN === "number" ? Math.min(10, Math.max(3, d.showTopN)) : 5,
    });
  });
}

export async function updateLiveSlide(partial: Partial<LiveSlideDoc>): Promise<void> {
  await setDoc(doc(db, SETTINGS_COLLECTION, LIVE_SLIDE_DOC_ID), partial, { merge: true });
}

export async function refreshLiveStatsRemote(): Promise<void> {
  const fn = httpsCallable(functions, "refreshLiveStats");
  await fn({});
}
