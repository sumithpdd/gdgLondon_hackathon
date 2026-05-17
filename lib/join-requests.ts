import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { JOIN_REQUESTS_COLLECTION, PROJECTS_COLLECTION } from "./constants";
import { getActiveHackathonId } from "./active-hackathon";
import { belongsToActiveHackathon } from "./hackathon-projects";
import type { JoinRequest } from "@/types/join-request";

/**
 * Returns the project a user is already part of (as owner or approved member),
 * or null if they are not in any project.
 */
export async function getUserProject(
  userId: string
): Promise<{ projectId: string; role: "owner" | "member" } | null> {
  const activeId = getActiveHackathonId();

  try {
    const ownerQuery = query(
      collection(db, PROJECTS_COLLECTION),
      where("userId", "==", userId),
      where("hackathonId", "==", activeId)
    );
    const ownerSnapshot = await getDocs(ownerQuery);
    if (!ownerSnapshot.empty) {
      return { projectId: ownerSnapshot.docs[0].id, role: "owner" };
    }
  } catch {
    const ownerSnapshot = await getDocs(
      query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId))
    );
    const ownerDoc = ownerSnapshot.docs.find((d) =>
      belongsToActiveHackathon(d.data() as { hackathonId?: string })
    );
    if (ownerDoc) {
      return { projectId: ownerDoc.id, role: "owner" };
    }
  }

  const memberQuery = query(
    collection(db, JOIN_REQUESTS_COLLECTION),
    where("userId", "==", userId),
    where("status", "==", "approved")
  );
  const memberSnapshot = await getDocs(memberQuery);
  for (const memberDoc of memberSnapshot.docs) {
    const projectId = memberDoc.data().projectId as string;
    if (!projectId) continue;
    const { getDoc: getDocFn } = await import("firebase/firestore");
    const projectSnap = await getDocFn(doc(db, PROJECTS_COLLECTION, projectId));
    if (projectSnap.exists() && belongsToActiveHackathon(projectSnap.data())) {
      return { projectId, role: "member" };
    }
  }

  return null;
}

export async function createJoinRequest(
  projectId: string,
  projectTitle: string,
  userId: string,
  userEmail: string,
  userName: string,
  message?: string
): Promise<string> {
  const fn = httpsCallable<
    { projectId: string; projectTitle: string; message?: string },
    { requestId: string }
  >(functions, "createJoinRequest");
  const result = await fn({ projectId, projectTitle, message });
  return result.data.requestId;
}

export async function getJoinRequestsForProject(
  projectId: string
): Promise<JoinRequest[]> {
  const q = query(
    collection(db, JOIN_REQUESTS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.(),
      respondedAt: data.respondedAt?.toDate?.(),
    };
  }) as JoinRequest[];
}

export async function getJoinRequestsForUser(
  userId: string
): Promise<JoinRequest[]> {
  const q = query(
    collection(db, JOIN_REQUESTS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.(),
      respondedAt: data.respondedAt?.toDate?.(),
    };
  }) as JoinRequest[];
}

export async function approveJoinRequest(
  requestId: string,
  projectId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  const fn = httpsCallable(functions, "handleJoinRequest");
  await fn({ requestId, action: "approve" });
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const fn = httpsCallable(functions, "handleJoinRequest");
  await fn({ requestId, action: "reject" });
}

export async function withdrawJoinRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, JOIN_REQUESTS_COLLECTION, requestId);
  await deleteDoc(requestRef);
}
