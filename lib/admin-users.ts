import { doc, updateDoc, deleteField, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { USERS_COLLECTION } from "./constants";
import type { UserProfile, UserRole } from "./auth";
import { parseParticipations } from "./auth";

export type AdminUserUpdate = {
  displayName?: string | null;
  profileDisplayName?: string | null;
  email?: string | null;
  role?: UserRole;
  hackathonBio?: string;
  city?: string;
  country?: string;
  teamPreference?: string;
  hackathonLinkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  buddiesVisibleInDirectory?: boolean;
  inPersonAttendance?: boolean | null;
};

export function parseUserProfileDoc(id: string, data: DocumentData): UserProfile {
  return {
    uid: (data.uid as string) || id,
    email: (data.email as string) ?? null,
    displayName: (data.displayName as string) ?? null,
    role: (data.role as UserRole) || "user",
    createdAt: data.createdAt?.toDate?.() || new Date(0),
    updatedAt: data.updatedAt?.toDate?.() || new Date(0),
    createdBy: data.createdBy as string | undefined,
    updatedBy: data.updatedBy as string | undefined,
    createdDate: data.createdDate?.toDate?.(),
    updatedDate: data.updatedDate?.toDate?.(),
    hackathonBio: data.hackathonBio as string | undefined,
    hackathonLinkedinUrl: data.hackathonLinkedinUrl as string | undefined,
    skills: data.skills as string[] | undefined,
    interests: data.interests as string[] | undefined,
    expertise: data.expertise as string[] | undefined,
    techStack: data.techStack as string[] | undefined,
    twitterUrl: data.twitterUrl as string | undefined,
    facebookUrl: data.facebookUrl as string | undefined,
    instagramUrl: data.instagramUrl as string | undefined,
    teamPreference: data.teamPreference as string | undefined,
    inPersonAttendance: data.inPersonAttendance as boolean | null | undefined,
    profileCompletionPercent: data.profileCompletionPercent as number | undefined,
    profileDisplayName: data.profileDisplayName as string | undefined,
    city: data.city as string | undefined,
    country: data.country as string | undefined,
    experienceLevel: data.experienceLevel as UserProfile["experienceLevel"],
    programmingSkills: data.programmingSkills as string[] | undefined,
    domainExpertise: data.domainExpertise as string[] | undefined,
    wantToLearnTags: data.wantToLearnTags as string[] | undefined,
    canOfferTags: data.canOfferTags as string[] | undefined,
    githubUrl: data.githubUrl as string | undefined,
    websiteUrl: data.websiteUrl as string | undefined,
    buddiesVisibleInDirectory: data.buddiesVisibleInDirectory as boolean | undefined,
    hackathonParticipations: parseParticipations(data.hackathonParticipations),
    deletedAt: data.deletedAt?.toDate?.() ?? (data.deletedAt ? new Date(data.deletedAt as string) : undefined),
    deletedBy: (data.deletedBy as string) ?? undefined,
  };
}

function auditFields(actorUid: string) {
  const now = new Date();
  return {
    updatedAt: now,
    updatedBy: actorUid,
    updatedDate: now,
  };
}

export async function updateUserAsAdmin(
  actorUid: string,
  targetUid: string,
  patch: AdminUserUpdate
): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, targetUid);
  const payload: Record<string, unknown> = { ...auditFields(actorUid) };

  if (patch.displayName !== undefined) payload.displayName = patch.displayName?.trim() || null;
  if (patch.profileDisplayName !== undefined) {
    payload.profileDisplayName = patch.profileDisplayName?.trim() || null;
  }
  if (patch.email !== undefined) payload.email = patch.email?.trim() || null;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.hackathonBio !== undefined) payload.hackathonBio = patch.hackathonBio.trim();
  if (patch.city !== undefined) payload.city = patch.city.trim();
  if (patch.country !== undefined) payload.country = patch.country.trim();
  if (patch.teamPreference !== undefined) payload.teamPreference = patch.teamPreference.trim();
  if (patch.hackathonLinkedinUrl !== undefined) {
    payload.hackathonLinkedinUrl = patch.hackathonLinkedinUrl.trim();
  }
  if (patch.githubUrl !== undefined) payload.githubUrl = patch.githubUrl.trim();
  if (patch.websiteUrl !== undefined) payload.websiteUrl = patch.websiteUrl.trim();
  if (patch.buddiesVisibleInDirectory !== undefined) {
    payload.buddiesVisibleInDirectory = patch.buddiesVisibleInDirectory;
  }
  if (patch.inPersonAttendance !== undefined) payload.inPersonAttendance = patch.inPersonAttendance;

  await updateDoc(ref, payload);
}

export async function softDeleteUser(actorUid: string, targetUid: string): Promise<void> {
  if (actorUid === targetUid) {
    throw new Error("You cannot delete your own account from the admin panel.");
  }
  const now = new Date();
  await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
    deletedAt: now,
    deletedBy: actorUid,
    buddiesVisibleInDirectory: false,
    ...auditFields(actorUid),
  });
}

export async function restoreUser(actorUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
    deletedAt: deleteField(),
    deletedBy: deleteField(),
    ...auditFields(actorUid),
  });
}
