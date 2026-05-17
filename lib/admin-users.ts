import { httpsCallable } from "firebase/functions";
import { collection, getDocs } from "firebase/firestore";
import { functions, db } from "./firebase";
import type { UserProfile, UserRole } from "./auth";
import { isUserDeleted, parseParticipations } from "./auth";
import type { DocumentData } from "firebase/firestore";
import { getActiveHackathonId } from "./active-hackathon";
import { USERS_COLLECTION } from "./constants";
import { getProfileCompletion } from "./profile-completion";
import { getActiveDataset, LEGACY_COLLECTIONS } from "./hackathon-collections";

/** User row in admin directory (may include legacy-only profiles not yet in the active collection). */
export type AdminListedUser = UserProfile & {
  listedFromLegacy?: boolean;
};

export type AdminUserUpdate = {
  displayName?: string | null;
  profileDisplayName?: string | null;
  email?: string | null;
  role?: UserRole;
  hackathonBio?: string;
  city?: string;
  country?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced" | "";
  programmingSkills?: string[];
  domainExpertise?: string[];
  interests?: string[];
  expertise?: string[];
  techStack?: string[];
  wantToLearnTags?: string[];
  canOfferTags?: string[];
  skills?: string[];
  hackathonLinkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  teamPreference?: string;
  buddiesVisibleInDirectory?: boolean;
  inPersonAttendance?: boolean | null;
  profileCompletionPercent?: number;
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
    adminProvisioned: data.adminProvisioned === true,
    profileStatus: data.profileStatus as UserProfile["profileStatus"],
    provisionedBy: data.provisionedBy as string | undefined,
    provisionedAt: data.provisionedAt?.toDate?.(),
  };
}

export type ProvisionHackathonUserInput = {
  email: string;
  displayName?: string;
  role?: UserRole;
};

export type ProvisionHackathonUserResult = {
  success: boolean;
  userId: string;
  created: boolean;
  email: string;
};

/** List user profiles for admin: active collection + legacy users not yet migrated (io2026 dataset). */
export async function listUsersForAdmin(): Promise<AdminListedUser[]> {
  const activeSnap = await getDocs(collection(db, USERS_COLLECTION));
  const byUid = new Map<string, AdminListedUser>();

  for (const d of activeSnap.docs) {
    byUid.set(d.id, parseUserProfileDoc(d.id, d.data()));
  }

  if (getActiveDataset() === "io2026") {
    const legacySnap = await getDocs(collection(db, LEGACY_COLLECTIONS.users));
    for (const d of legacySnap.docs) {
      if (!byUid.has(d.id)) {
        byUid.set(d.id, {
          ...parseUserProfileDoc(d.id, d.data()),
          listedFromLegacy: true,
        });
      }
    }
  }

  return Array.from(byUid.values());
}

export type AdminLookupUserResult = {
  email: string;
  foundInAuth: boolean;
  userId?: string;
  inActiveUsers: boolean;
  inLegacyUsers: boolean;
  displayName?: string | null;
  canProvision: boolean;
};

export async function lookupUserByEmailForAdmin(email: string): Promise<AdminLookupUserResult> {
  const fn = httpsCallable<{ email: string }, AdminLookupUserResult>(
    functions,
    "adminLookupUserByEmail"
  );
  const result = await fn({ email: email.trim() });
  return result.data;
}

export function looksLikeEmailQuery(q: string): boolean {
  const t = q.trim();
  return t.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export type AdminUserListFilters = {
  searchQuery?: string;
  hackathonId?: string;
  currentHackathonOnly?: boolean;
  incompleteOnly?: boolean;
  roleFilter?: "all" | UserRole;
  statusFilter?: "active" | "deleted" | "all";
};

export type AdminUserSortMode = "newest" | "oldest" | "name";

export function matchesAdminUserSearch(u: UserProfile, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const partKeys = u.hackathonParticipations ? Object.keys(u.hackathonParticipations) : [];
  const email = u.email?.trim().toLowerCase() ?? "";
  return (
    email.includes(s) ||
    email === s ||
    (u.displayName?.toLowerCase().includes(s) ?? false) ||
    (u.profileDisplayName?.toLowerCase().includes(s) ?? false) ||
    u.uid.toLowerCase().includes(s) ||
    partKeys.some((k) => k.toLowerCase().includes(s))
  );
}

export function filterAdminUsers(users: AdminListedUser[], filters: AdminUserListFilters): AdminListedUser[] {
  const hackathonId = filters.hackathonId ?? getActiveHackathonId();
  let list = users.filter((u) => matchesAdminUserSearch(u, filters.searchQuery ?? ""));

  if (filters.currentHackathonOnly) {
    list = list.filter((u) => userParticipatesInHackathon(u, hackathonId));
  }
  if (filters.incompleteOnly) {
    list = list.filter((u) => !getProfileCompletion(u).complete);
  }
  if (filters.roleFilter && filters.roleFilter !== "all") {
    list = list.filter((u) => (u.role || "user") === filters.roleFilter);
  }
  if (filters.statusFilter === "active") {
    list = list.filter((u) => !isUserDeleted(u));
  } else if (filters.statusFilter === "deleted") {
    list = list.filter((u) => isUserDeleted(u));
  }
  return list;
}

export function sortAdminUsers(users: AdminListedUser[], sortMode: AdminUserSortMode): AdminListedUser[] {
  const out = [...users];
  out.sort((a, b) => {
    if (sortMode === "name") {
      const an = (a.displayName || a.email || a.uid).toLowerCase();
      const bn = (b.displayName || b.email || b.uid).toLowerCase();
      return an.localeCompare(bn);
    }
    const at = a.createdAt?.getTime() ?? 0;
    const bt = b.createdAt?.getTime() ?? 0;
    return sortMode === "newest" ? bt - at : at - bt;
  });
  return out;
}

export function formatParticipationSummary(u: UserProfile): string {
  const p = u.hackathonParticipations;
  if (!p || !Object.keys(p).length) return "—";
  return Object.keys(p).join(", ");
}

export async function provisionHackathonUserByEmail(
  input: ProvisionHackathonUserInput
): Promise<ProvisionHackathonUserResult> {
  const fn = httpsCallable<
    { email: string; displayName?: string; role?: UserRole },
    ProvisionHackathonUserResult
  >(functions, "adminProvisionHackathonUser");
  const result = await fn({
    email: input.email.trim(),
    displayName: input.displayName?.trim() || undefined,
    role: input.role,
  });
  return result.data;
}

export function userParticipatesInHackathon(
  u: UserProfile,
  hackathonId: string = getActiveHackathonId()
): boolean {
  return Boolean(u.hackathonParticipations?.[hackathonId]?.joinedAt);
}

export function formatUserDate(d: Date | undefined): string {
  if (!d || d.getTime() <= 0) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function callableErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Something went wrong. Please try again.";
}

function buildAdminPatch(patch: AdminUserUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.displayName !== undefined) out.displayName = patch.displayName?.trim() || null;
  if (patch.profileDisplayName !== undefined) {
    out.profileDisplayName = patch.profileDisplayName?.trim() || null;
  }
  if (patch.email !== undefined) out.email = patch.email?.trim() || null;
  if (patch.hackathonBio !== undefined) out.hackathonBio = patch.hackathonBio.trim();
  if (patch.city !== undefined) out.city = patch.city.trim();
  if (patch.country !== undefined) out.country = patch.country.trim();
  if (patch.experienceLevel !== undefined) {
    out.experienceLevel = patch.experienceLevel || null;
  }
  if (patch.programmingSkills !== undefined) out.programmingSkills = patch.programmingSkills;
  if (patch.domainExpertise !== undefined) out.domainExpertise = patch.domainExpertise;
  if (patch.interests !== undefined) out.interests = patch.interests;
  if (patch.expertise !== undefined) out.expertise = patch.expertise;
  if (patch.techStack !== undefined) out.techStack = patch.techStack;
  if (patch.wantToLearnTags !== undefined) out.wantToLearnTags = patch.wantToLearnTags;
  if (patch.canOfferTags !== undefined) out.canOfferTags = patch.canOfferTags;
  if (patch.skills !== undefined) out.skills = patch.skills;
  if (patch.hackathonLinkedinUrl !== undefined) {
    out.hackathonLinkedinUrl = patch.hackathonLinkedinUrl.trim();
  }
  if (patch.githubUrl !== undefined) out.githubUrl = patch.githubUrl.trim();
  if (patch.websiteUrl !== undefined) out.websiteUrl = patch.websiteUrl.trim();
  if (patch.twitterUrl !== undefined) out.twitterUrl = patch.twitterUrl.trim();
  if (patch.facebookUrl !== undefined) out.facebookUrl = patch.facebookUrl.trim();
  if (patch.instagramUrl !== undefined) out.instagramUrl = patch.instagramUrl.trim();
  if (patch.teamPreference !== undefined) out.teamPreference = patch.teamPreference.trim();
  if (patch.buddiesVisibleInDirectory !== undefined) {
    out.buddiesVisibleInDirectory = patch.buddiesVisibleInDirectory;
  }
  if (patch.inPersonAttendance !== undefined) out.inPersonAttendance = patch.inPersonAttendance;
  if (patch.profileCompletionPercent !== undefined) {
    out.profileCompletionPercent = patch.profileCompletionPercent;
  }
  return out;
}

export async function setUserRoleAsAdmin(targetUserId: string, role: UserRole): Promise<void> {
  const fn = httpsCallable<{ targetUserId: string; role: UserRole }, { success: boolean }>(
    functions,
    "setUserRole"
  );
  await fn({ targetUserId, role });
}

export async function updateUserAsAdmin(
  _actorUid: string,
  targetUid: string,
  patch: AdminUserUpdate
): Promise<void> {
  const { role, ...rest } = patch;
  const profilePatch = buildAdminPatch(rest);

  if (Object.keys(profilePatch).length > 0) {
    const fn = httpsCallable<
      { targetUserId: string; patch: Record<string, unknown> },
      { success: boolean }
    >(functions, "adminUpdateUser");
    await fn({ targetUserId: targetUid, patch: profilePatch });
  }

  if (role !== undefined) {
    await setUserRoleAsAdmin(targetUid, role);
  }
}

export async function softDeleteUser(actorUid: string, targetUid: string): Promise<void> {
  if (actorUid === targetUid) {
    throw new Error("You cannot delete your own account from the admin panel.");
  }
  const fn = httpsCallable<{ targetUserId: string; restore: boolean }, { success: boolean }>(
    functions,
    "adminSetUserDeleted"
  );
  await fn({ targetUserId: targetUid, restore: false });
}

export async function restoreUser(_actorUid: string, targetUid: string): Promise<void> {
  const fn = httpsCallable<{ targetUserId: string; restore: boolean }, { success: boolean }>(
    functions,
    "adminSetUserDeleted"
  );
  await fn({ targetUserId: targetUid, restore: true });
}
