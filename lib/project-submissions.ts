/**
 * Create / update hackathon projects in the active Firestore collection (io2026Hackathon_projects).
 * Always stamps hackathonId + userId on every write.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { User } from "firebase/auth";
import { db, functions } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { getActiveHackathonId, getActiveHackathonName } from "@/lib/active-hackathon";
import type { UserProfile } from "@/lib/auth";

export type ProjectWriteStatus = "draft" | "submitted";

export type ProjectOwnerContext = {
  user: User;
  userProfile: UserProfile | null;
};

/** Identity + hackathon edition tags required on every project document. */
export function stampProjectOwnership(
  uid: string,
  email: string | null | undefined,
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...data,
    userId: uid,
    userEmail: email ?? "",
    hackathonId: getActiveHackathonId(),
    hackathonName: getActiveHackathonName(),
  };
}

/** Firestore rejects `undefined` field values on write. */
export function omitUndefinedFields<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) {
      delete out[key];
    }
  }
  return out;
}

export function buildProjectContactFields(ctx: ProjectOwnerContext): Record<string, unknown> {
  const { user, userProfile } = ctx;
  return omitUndefinedFields({
    fullName: (userProfile?.profileDisplayName || user.displayName || user.email?.split("@")[0] || "").trim(),
    email: (user.email || "").trim(),
    linkedinUrl: (userProfile?.hackathonLinkedinUrl || "").trim(),
    websiteUrl: (userProfile?.websiteUrl || "").trim(),
    twitterUrl: (userProfile?.twitterUrl || "").trim(),
    facebookUrl: (userProfile?.facebookUrl || "").trim(),
    instagramUrl: (userProfile?.instagramUrl || "").trim(),
    interests: userProfile?.interests ?? userProfile?.wantToLearnTags ?? [],
    expertise: userProfile?.expertise ?? userProfile?.domainExpertise ?? [],
    techStack:
      userProfile?.techStack?.length
        ? userProfile.techStack
        : userProfile?.programmingSkills ?? userProfile?.skills ?? [],
    ...(user.photoURL ? { ownerPhotoUrl: user.photoURL } : {}),
  });
}

/** Find this user's project for the active hackathon edition. */
export async function findUserProjectForActiveHackathon(
  userId: string
): Promise<{ id: string; data: DocumentData } | null> {
  const activeId = getActiveHackathonId();

  const tagged = await getDocs(
    query(
      collection(db, PROJECTS_COLLECTION),
      where("userId", "==", userId),
      where("hackathonId", "==", activeId),
      limit(1)
    )
  );
  if (!tagged.empty) {
    const d = tagged.docs[0];
    return { id: d.id, data: d.data() };
  }

  /** Legacy row in io2026 collection missing hackathonId — pick up once and re-tag on save. */
  const legacy = await getDocs(
    query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId), limit(1))
  );
  if (!legacy.empty) {
    const d = legacy.docs[0];
    return { id: d.id, data: d.data() };
  }

  return null;
}

export async function getOwnedProjectDoc(
  projectId: string,
  userId: string
): Promise<{ id: string; data: DocumentData } | null> {
  const snap = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.userId !== userId) return null;
  return { id: snap.id, data };
}

export function projectCallableError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Something went wrong. Please try again.";
}

/**
 * Create or update a project in PROJECTS_COLLECTION (client SDK; rules enforce ownership).
 */
export async function saveProjectDocument(params: {
  ctx: ProjectOwnerContext;
  existingProjectId: string | null;
  fields: Record<string, unknown>;
  status: ProjectWriteStatus;
  preserveSubmittedStatus?: boolean;
}): Promise<string> {
  const { ctx, existingProjectId, fields, status, preserveSubmittedStatus } = params;
  const uid = ctx.user.uid;
  const now = serverTimestamp();

  const nextStatus =
    preserveSubmittedStatus && status === "draft" ? "submitted" : status;

  const payload = omitUndefinedFields(
    stampProjectOwnership(uid, ctx.user.email, {
      ...fields,
      status: nextStatus,
      updatedAt: now,
      updatedBy: uid,
      updatedDate: now,
    })
  );

  if (existingProjectId) {
    await updateDoc(doc(db, PROJECTS_COLLECTION, existingProjectId), payload);
    return existingProjectId;
  }

  try {
    const ref = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...payload,
      place: null,
      likes: 0,
      views: 0,
      voteTotal: 0,
      createdAt: now,
      createdBy: uid,
      createdDate: now,
    });
    return ref.id;
  } catch (clientErr) {
    const createProjectFn = httpsCallable<Record<string, unknown>, { projectId: string }>(
      functions,
      "createProject"
    );
    const result = await createProjectFn({
      ...omitUndefinedFields(fields),
      status: nextStatus,
    });
    return result.data.projectId;
  }
}
