import {
  collection,
  getDocs,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import type { Submission } from "@/types/submission";

function mapProjectDoc(docSnap: QueryDocumentSnapshot<DocumentData>): Submission {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.(),
    createdDate: data.createdDate?.toDate?.(),
    updatedDate: data.updatedDate?.toDate?.(),
    projectStartDate: data.projectStartDate?.toDate?.(),
  } as Submission;
}

/** All projects in the live collection (draft + submitted), newest first. */
export async function fetchAllProjectsForAdmin(): Promise<Submission[]> {
  const col = collection(db, PROJECTS_COLLECTION);
  try {
    const q = query(col, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(mapProjectDoc);
  } catch {
    const snap = await getDocs(col);
    const items = snap.docs.map(mapProjectDoc);
    items.sort((a, b) => {
      const at = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bt - at;
    });
    return items;
  }
}

export type AdminProjectStatusFilter = "all" | "draft" | "submitted";

export function filterAdminProjects(
  projects: Submission[],
  opts: { search?: string; status?: AdminProjectStatusFilter }
): Submission[] {
  const q = opts.search?.trim().toLowerCase() ?? "";
  let list = projects;

  if (opts.status === "draft") {
    list = list.filter((p) => p.status === "draft");
  } else if (opts.status === "submitted") {
    list = list.filter((p) => p.status === "submitted" || p.status === "finalist" || p.status === "winner");
  }

  if (!q) return list;

  return list.filter((p) => {
    const haystack = [
      p.projectTitle,
      p.teamName,
      p.fullName,
      p.email,
      p.userEmail,
      p.appPurpose,
      p.githubUrl,
      p.userId,
      p.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function adminProjectStatusLabel(status?: Submission["status"]): string {
  switch (status) {
    case "submitted":
      return "Final";
    case "draft":
      return "Draft";
    case "finalist":
      return "Finalist";
    case "winner":
      return "Winner";
    default:
      return "Unknown";
  }
}

export function adminProjectTypeLabel(type?: Submission["projectType"]): string {
  if (type === "team") return "Team";
  if (type === "solo") return "Solo";
  return "—";
}
