import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import {
  PROJECTS_COLLECTION,
  VOTES_COLLECTION,
  SETTINGS_COLLECTION,
  SETTINGS_DOC_ID,
} from "./constants";
import { getActiveHackathonId } from "./active-hackathon";
import { getAttendanceForUser } from "./attendance";
import { formatLocaleDateTime } from "./format-date";

/** Organisers (admin / moderator) vs participants. */
export const VOTE_BUDGET_ORGANISER = 10;
export const VOTE_BUDGET_PARTICIPANT = 5;
export const VOTE_MAX_PER_PROJECT = 2;

export type VoteAllocation = Record<string, number>;

export function voteBudgetForRole(role?: string | null): number {
  if (role === "admin" || role === "moderator") return VOTE_BUDGET_ORGANISER;
  return VOTE_BUDGET_PARTICIPANT;
}

export type UserVoteLine = {
  projectId: string;
  voteCount: number;
};

function mapVoteDocs(
  docs: { data: () => Record<string, unknown> }[],
  hackathonId: string
): UserVoteLine[] {
  return docs
    .map((d) => {
      const data = d.data();
      if (data.hackathonId && data.hackathonId !== hackathonId) return null;
      return {
        projectId: String(data.projectId || ""),
        voteCount: Number(data.voteCount) || 0,
      };
    })
    .filter((v): v is UserVoteLine => !!v && !!v.projectId && v.voteCount > 0);
}

export async function fetchUserVotes(uid: string): Promise<UserVoteLine[]> {
  const hackathonId = getActiveHackathonId();
  const composite = query(
    collection(db, VOTES_COLLECTION),
    where("userId", "==", uid),
    where("hackathonId", "==", hackathonId)
  );
  try {
    const snap = await getDocs(composite);
    return mapVoteDocs(snap.docs, hackathonId);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code !== "failed-precondition") throw err;
    const fallback = query(collection(db, VOTES_COLLECTION), where("userId", "==", uid));
    const snap = await getDocs(fallback);
    return mapVoteDocs(snap.docs, hackathonId);
  }
}

export async function fetchVotingSettings(): Promise<{
  votingOpen: boolean;
  votingOpensAt?: Date;
  votingClosesAt?: Date;
  winnersAnnounced: boolean;
  message?: string;
}> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
  const data = snap.data();
  const now = Date.now();
  const opens = data?.votingOpensAt?.toDate?.() as Date | undefined;
  const closes = data?.votingClosesAt?.toDate?.() as Date | undefined;
  const winnersAnnounced = Boolean(data?.winnersAnnounced);

  let votingOpen = !winnersAnnounced;
  let message: string | undefined;

  if (opens && now < opens.getTime()) {
    votingOpen = false;
    message = `Voting opens ${formatLocaleDateTime(opens)}.`;
  }
  if (closes && now > closes.getTime()) {
    votingOpen = false;
    message = "Voting has closed.";
  }
  if (winnersAnnounced) {
    votingOpen = false;
    message = "Winners have been announced.";
  }

  return { votingOpen, votingOpensAt: opens, votingClosesAt: closes, winnersAnnounced, message };
}

export async function isUserEligibleToVote(uid: string): Promise<boolean> {
  const attendance = await getAttendanceForUser(uid);
  return Boolean(attendance?.attendanceVerified);
}

export type VoteableProject = {
  id: string;
  projectTitle?: string;
  teamName?: string;
  pitchLine?: string;
  appPurpose?: string;
  fullName?: string;
  builtWith?: string[];
  voteTotal?: number;
  status?: string;
  userId: string;
  hackathonId?: string;
};

export function matchesVoteProjectSearch(project: VoteableProject, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    project.projectTitle,
    project.teamName,
    project.pitchLine,
    project.appPurpose,
    project.fullName,
    ...(project.builtWith || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterVoteableProjects(
  projects: VoteableProject[],
  searchQuery: string
): VoteableProject[] {
  return projects.filter((p) => matchesVoteProjectSearch(p, searchQuery));
}

export async function fetchVoteableProjects(): Promise<VoteableProject[]> {
  const hackathonId = getActiveHackathonId();
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("status", "==", "submitted"),
    orderBy("voteTotal", "desc"),
    limit(200)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as VoteableProject))
      .filter((p) => !p.hackathonId || p.hackathonId === hackathonId);
  } catch {
    const fallback = query(
      collection(db, PROJECTS_COLLECTION),
      where("status", "==", "submitted"),
      limit(200)
    );
    const snap = await getDocs(fallback);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as VoteableProject & { hackathonId?: string }))
      .filter((p) => !p.hackathonId || p.hackathonId === hackathonId)
      .sort((a, b) => (b.voteTotal ?? 0) - (a.voteTotal ?? 0));
  }
}

export async function castVotes(allocations: VoteAllocation): Promise<{
  success: boolean;
  totalVotes: number;
  budget: number;
}> {
  const fn = httpsCallable<
    { allocations: VoteAllocation },
    { success: boolean; totalVotes: number; budget: number }
  >(functions, "castVotes");
  const result = await fn({ allocations });
  return result.data;
}

export async function assignWinnersFromVotes(): Promise<{
  success: boolean;
  places: Record<string, string>;
}> {
  const fn = httpsCallable<Record<string, never>, { success: boolean; places: Record<string, string> }>(
    functions,
    "assignWinnersFromVotes"
  );
  const result = await fn({});
  return result.data;
}
