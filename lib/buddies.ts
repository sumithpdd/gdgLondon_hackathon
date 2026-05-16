import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  deleteDoc,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { USERS_COLLECTION, BUDDY_REQUESTS_COLLECTION } from "./constants";
import type { BuddyRequest, BuddyRequestStatus } from "@/types/buddy-request";

export type DirectoryProfile = {
  uid: string;
  displayName: string;
  city?: string;
  country?: string;
  bio?: string;
  experienceLevel?: string;
  programmingSkills?: string[];
  githubUrl?: string;
  hackathonLinkedinUrl?: string;
};

function mapUserDoc(uid: string, data: DocumentData): DirectoryProfile {
  return {
    uid,
    displayName: (data.profileDisplayName as string) || (data.displayName as string) || "Attendee",
    city: data.city as string | undefined,
    country: data.country as string | undefined,
    bio: data.hackathonBio as string | undefined,
    experienceLevel: data.experienceLevel as string | undefined,
    programmingSkills: (data.programmingSkills as string[]) || [],
    githubUrl: data.githubUrl as string | undefined,
    hackathonLinkedinUrl: data.hackathonLinkedinUrl as string | undefined,
  };
}

function mapBuddyDoc(d: QueryDocumentSnapshot): BuddyRequest {
  const data = d.data();
  return {
    id: d.id,
    fromUserId: data.fromUserId as string,
    toUserId: data.toUserId as string,
    fromDisplayName: (data.fromDisplayName as string) || "Someone",
    toDisplayName: data.toDisplayName as string | undefined,
    status: data.status as BuddyRequestStatus,
    createdAt: data.createdAt?.toDate?.(),
    respondedAt: data.respondedAt?.toDate?.(),
  };
}

/** Profiles visible in the buddies directory (public opted-in). */
export async function listDirectoryProfiles(): Promise<DirectoryProfile[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("buddiesVisibleInDirectory", "==", true),
    limit(200)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapUserDoc(d.id, d.data()));
}

export async function listIncomingBuddyRequests(uid: string): Promise<BuddyRequest[]> {
  const q = query(
    collection(db, BUDDY_REQUESTS_COLLECTION),
    where("toUserId", "==", uid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapBuddyDoc);
}

export async function listOutgoingBuddyRequests(uid: string): Promise<BuddyRequest[]> {
  const q = query(
    collection(db, BUDDY_REQUESTS_COLLECTION),
    where("fromUserId", "==", uid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapBuddyDoc);
}

export async function countIncomingPending(uid: string): Promise<number> {
  const list = await listIncomingBuddyRequests(uid);
  return list.length;
}

async function findPendingPair(fromUid: string, toUid: string): Promise<string | null> {
  const q = query(
    collection(db, BUDDY_REQUESTS_COLLECTION),
    where("fromUserId", "==", fromUid),
    where("status", "==", "pending"),
    limit(25)
  );
  const snap = await getDocs(q);
  const hit = snap.docs.find((d) => d.data().toUserId === toUid);
  return hit?.id ?? null;
}

export async function createBuddyRequest(params: {
  fromUid: string;
  toUid: string;
  fromDisplayName: string;
  toDisplayName?: string;
}): Promise<void> {
  if (params.fromUid === params.toUid) throw new Error("Cannot buddy yourself.");
  const existing = await findPendingPair(params.fromUid, params.toUid);
  if (existing) throw new Error("You already have a pending request to this person.");
  const reverse = await findPendingPair(params.toUid, params.fromUid);
  if (reverse) throw new Error("This person already sent you a request — check Incoming.");

  await addDoc(collection(db, BUDDY_REQUESTS_COLLECTION), {
    fromUserId: params.fromUid,
    toUserId: params.toUid,
    fromDisplayName: params.fromDisplayName,
    toDisplayName: params.toDisplayName ?? null,
    status: "pending" as BuddyRequestStatus,
    createdAt: Timestamp.now(),
  });
}

export async function respondBuddyRequest(
  requestId: string,
  uid: string,
  status: "accepted" | "declined"
): Promise<void> {
  await updateDoc(doc(db, BUDDY_REQUESTS_COLLECTION, requestId), {
    status,
    respondedAt: Timestamp.now(),
    respondedBy: uid,
  });
}

export async function cancelOutgoingBuddyRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, BUDDY_REQUESTS_COLLECTION, requestId));
}

export async function listAcceptedBuddies(uid: string): Promise<BuddyRequest[]> {
  const fromSnap = await getDocs(
    query(
      collection(db, BUDDY_REQUESTS_COLLECTION),
      where("fromUserId", "==", uid),
      where("status", "==", "accepted"),
      limit(100)
    )
  );
  const toSnap = await getDocs(
    query(
      collection(db, BUDDY_REQUESTS_COLLECTION),
      where("toUserId", "==", uid),
      where("status", "==", "accepted"),
      limit(100)
    )
  );
  const merged = [...fromSnap.docs, ...toSnap.docs].map(mapBuddyDoc);
  const seen = new Set<string>();
  return merged.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

export async function getUserPublicSnippet(uid: string): Promise<DirectoryProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return mapUserDoc(snap.id, snap.data());
}
