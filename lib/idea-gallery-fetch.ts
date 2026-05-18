import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import type { Submission } from "@/types/submission";
import { isIdeaGalleryProject, sortIdeasGalleryProjects } from "@/lib/hackathon-projects";

function mapDoc(d: { id: string; data: () => Record<string, unknown> }): Submission {
  const raw = d.data();
  return {
    id: d.id,
    ...raw,
    createdAt: (raw.createdAt as { toDate?: () => Date })?.toDate?.(),
  } as Submission;
}

/** Submitted + recruiting drafts for the active hackathon edition. */
export async function fetchIdeaGalleryProjects(): Promise<Submission[]> {
  const base = collection(db, PROJECTS_COLLECTION);

  try {
    const q = query(base, where("status", "==", "submitted"), orderBy("createdAt", "desc"), limit(200));
    const snap = await getDocs(q);
    const items = snap.docs.map(mapDoc).filter(isIdeaGalleryProject);
    return sortIdeasGalleryProjects(items);
  } catch {
    const q = query(base, orderBy("createdAt", "desc"), limit(200));
    const snap = await getDocs(q);
    const items = snap.docs.map(mapDoc).filter(isIdeaGalleryProject);
    return sortIdeasGalleryProjects(items);
  }
}
