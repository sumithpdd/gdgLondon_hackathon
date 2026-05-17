import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { IWD2026_COLLECTIONS } from "./hackathon-collections";
import {
  isArchivedIdeaProject,
  projectsWithWinnerPlace,
  sortByWinnerPlace,
} from "./hackathon-projects";
export type ArchivedProject = {
  place?: "first" | "second" | "third" | null;
  status?: string;
  fullName?: string;
  teamName?: string;
  projectTitle?: string;
  teamMembers?: { name?: string }[];
  id: string;
  appPurpose?: string;
  githubUrl?: string;
  demoVideoUrl?: string;
  label?: string;
  screenshots?: string[];
  lookingForMembers?: boolean;
};

type WinnerRow = {
  projectId: string;
  place: "first" | "second" | "third";
  projectTitle?: string;
  teamName?: string;
  githubUrl?: string;
  demoVideoUrl?: string;
  appPurpose?: string;
  screenshots?: string[];
};

function mergeWinnerRows(projects: ArchivedProject[], winners: WinnerRow[]): ArchivedProject[] {
  const byId = new Map(projects.map((p) => [p.id, { ...p }]));

  for (const w of winners) {
    const id = w.projectId;
    if (!id) continue;
    const existing = byId.get(id);
    if (existing) {
      if (!existing.place) existing.place = w.place;
      existing.projectTitle = existing.projectTitle || w.projectTitle;
      existing.teamName = existing.teamName || w.teamName;
      existing.githubUrl = existing.githubUrl || w.githubUrl;
      existing.demoVideoUrl = existing.demoVideoUrl || w.demoVideoUrl;
      existing.appPurpose = existing.appPurpose || w.appPurpose;
      existing.screenshots = existing.screenshots?.length ? existing.screenshots : w.screenshots;
    } else {
      byId.set(id, {
        id,
        place: w.place,
        projectTitle: w.projectTitle,
        teamName: w.teamName,
        githubUrl: w.githubUrl,
        demoVideoUrl: w.demoVideoUrl,
        appPurpose: w.appPurpose,
        screenshots: w.screenshots,
        status: "winner",
      });
    }
  }

  return sortByWinnerPlace(Array.from(byId.values()));
}

/** Load IWD 2026 archive: projects + derived winner rows. */
export async function fetchArchivedHackathonProjects(): Promise<{
  projects: ArchivedProject[];
  winners: ArchivedProject[];
  pastIdeas: ArchivedProject[];
}> {
  const [projectsSnap, winnersSnap] = await Promise.all([
    getDocs(collection(db, IWD2026_COLLECTIONS.projects)),
    getDocs(collection(db, IWD2026_COLLECTIONS.winners)),
  ]);

  const projects: ArchivedProject[] = projectsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ArchivedProject[];

  const winnerRows: WinnerRow[] = winnersSnap.docs
    .map((d) => ({ ...d.data(), projectId: d.data().projectId || d.id } as WinnerRow))
    .filter((w) => w.place === "first" || w.place === "second" || w.place === "third");

  const merged = mergeWinnerRows(projects, winnerRows);
  const winners = projectsWithWinnerPlace(merged);
  const pastIdeas = merged.filter(
    (p) => isArchivedIdeaProject(p) && p.place !== "first" && p.place !== "second" && p.place !== "third"
  );

  return { projects: merged, winners, pastIdeas };
}

export function getArchiveProjectTitle(p: ArchivedProject): string {
  return (p.projectTitle || p.teamName || "").trim() || "Untitled";
}

/** Heuristic for admin cleanup (test / empty titles). */
export function isLowQualityArchiveProject(p: ArchivedProject): boolean {
  const title = getArchiveProjectTitle(p).toLowerCase();
  if (title === "untitled") return true;
  if (title === "test" || title.startsWith("test ")) return true;
  return false;
}

export function matchesArchiveSearch(p: ArchivedProject, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return (
    getArchiveProjectTitle(p).toLowerCase().includes(s) ||
    (p.teamName || "").toLowerCase().includes(s) ||
    (p.appPurpose || "").toLowerCase().includes(s) ||
    (p.fullName || "").toLowerCase().includes(s)
  );
}

/** Admin-only: remove archived project, comments, and linked winner rows. */
async function deleteArchivedProjectViaFirestore(projectId: string): Promise<void> {
  const projectRef = doc(db, IWD2026_COLLECTIONS.projects, projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    throw new Error("Archived project not found.");
  }

  const commentsSnap = await getDocs(collection(projectRef, "comments"));
  const winnersSnap = await getDocs(
    query(collection(db, IWD2026_COLLECTIONS.winners), where("projectId", "==", projectId))
  );

  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  winnersSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(projectRef);
  await batch.commit();
}

export async function deleteArchivedProjectAsAdmin(projectId: string): Promise<void> {
  try {
    await deleteArchivedProjectViaFirestore(projectId);
    return;
  } catch (e) {
    const code = e instanceof FirebaseError ? e.code : "";
    if (code !== "permission-denied") throw e;
  }

  const fn = httpsCallable<{ projectId: string }, { success: boolean }>(
    functions,
    "deleteArchivedProject"
  );
  await fn({ projectId });
}
