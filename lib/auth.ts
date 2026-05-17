import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { USERS_COLLECTION } from "./constants";
import { syncUserProfileOnAuth } from "./user-profile-sync";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function preferGoogleRedirect(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function loginWithEmail(email: string, password: string) {
  const e = email.trim();
  const p = password;
  if (!e || !p) {
    const err = new Error("missing-email-or-password") as Error & { code: string };
    err.code = "auth/argument-error";
    throw err;
  }
  return signInWithEmailAndPassword(auth, e, p);
}

export async function sendPasswordResetToEmail(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) {
    const err = new Error("missing-email") as Error & { code: string };
    err.code = "auth/missing-email";
    throw err;
  }
  const base =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL?.trim()) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const url = base ? `${base.replace(/\/$/, "")}/hackathon` : undefined;
  await sendPasswordResetEmail(
    auth,
    trimmed,
    url && /^https?:\/\//i.test(url) ? { url, handleCodeInApp: false } : undefined
  );
}

/** Popup on desktop; redirect on mobile (returns null while navigation happens). */
export async function loginWithGoogle(): Promise<UserCredential | null> {
  if (preferGoogleRedirect()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  return signInWithPopup(auth, googleProvider);
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  await createOrUpdateUserProfile(result.user);
  return result;
}

export function parseParticipations(raw: unknown): Record<string, { joinedAt?: Date }> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, { joinedAt?: Date }> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const jo = (v as { joinedAt?: { toDate?: () => Date } }).joinedAt;
    out[k] = { joinedAt: jo && typeof jo.toDate === "function" ? jo.toDate() : undefined };
  }
  return Object.keys(out).length ? out : undefined;
}

export type UserRole = "admin" | "moderator" | "user";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
  /** Short intro for teams / directory */
  hackathonBio?: string;
  hackathonLinkedinUrl?: string;
  skills?: string[];
  interests?: string[];
  /** Admin-managed tag picks (Interests collection). */
  expertise?: string[];
  techStack?: string[];
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  teamPreference?: string;
  /** true / false / null = “unsure” stored as null optional */
  inPersonAttendance?: boolean | null;
  profileCompletionPercent?: number;
  /** Public name in directory (defaults to displayName) */
  profileDisplayName?: string;
  city?: string;
  country?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  programmingSkills?: string[];
  domainExpertise?: string[];
  wantToLearnTags?: string[];
  canOfferTags?: string[];
  githubUrl?: string;
  websiteUrl?: string;
  /** Opt in to the Buddies public attendee directory */
  buddiesVisibleInDirectory?: boolean;
  /** Hackathon ids this user has joined (metadata; keys = registry ids e.g. io2026Hackathon). */
  hackathonParticipations?: Record<string, { joinedAt?: Date }>;
  /** Soft-delete: set by admin; user doc remains for audit. */
  deletedAt?: Date | null;
  deletedBy?: string | null;
  /** Admin created profile before user completed sign-in / profile. */
  adminProvisioned?: boolean;
  profileStatus?: "provisioned" | "active";
  provisionedBy?: string;
  provisionedAt?: Date;
}

export function isUserDeleted(profile: Pick<UserProfile, "deletedAt"> | null | undefined): boolean {
  return profile?.deletedAt != null;
}

export function isOrganiserRole(role: UserRole | string | undefined | null): boolean {
  return role === "admin" || role === "moderator";
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role || "user",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        createdDate: data.createdDate?.toDate?.(),
        updatedDate: data.updatedDate?.toDate?.(),
        hackathonBio: data.hackathonBio,
        hackathonLinkedinUrl: data.hackathonLinkedinUrl,
        skills: data.skills,
        interests: data.interests,
        expertise: data.expertise,
        techStack: data.techStack,
        twitterUrl: data.twitterUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        teamPreference: data.teamPreference,
        inPersonAttendance: data.inPersonAttendance,
        profileCompletionPercent: data.profileCompletionPercent,
        profileDisplayName: data.profileDisplayName,
        city: data.city,
        country: data.country,
        experienceLevel: data.experienceLevel,
        programmingSkills: data.programmingSkills,
        domainExpertise: data.domainExpertise,
        wantToLearnTags: data.wantToLearnTags,
        canOfferTags: data.canOfferTags,
        githubUrl: data.githubUrl,
        websiteUrl: data.websiteUrl,
        buddiesVisibleInDirectory: data.buddiesVisibleInDirectory,
        hackathonParticipations: parseParticipations(data.hackathonParticipations),
        deletedAt: data.deletedAt?.toDate?.() ?? undefined,
        deletedBy: (data.deletedBy as string) ?? undefined,
        adminProvisioned: data.adminProvisioned === true,
        profileStatus: data.profileStatus as UserProfile["profileStatus"],
        provisionedBy: data.provisionedBy as string | undefined,
        provisionedAt: data.provisionedAt?.toDate?.(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Create or update user profile in Firestore
 * This is called automatically when a user signs in or signs up
 */
export async function createOrUpdateUserProfile(user: User): Promise<void> {
  if (!user?.uid) {
    console.error("Cannot create profile: Invalid user object");
    return;
  }

  try {
    await syncUserProfileOnAuth(user);
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error creating/updating user profile:", code || message);
    throw error;
  }
}

/**
 * Check if the current user has admin role
 * 
 * To set up admin users:
 * 1. Go to Firebase Console → Firestore Database
 * 2. Find the user document in the users collection (see constants)
 * 3. Update the 'role' field to 'admin'
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  
  const profile = await getUserProfile(uid);
  return profile?.role === "admin";
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  const profile = await getUserProfile(uid);
  return profile?.role || "user";
}

