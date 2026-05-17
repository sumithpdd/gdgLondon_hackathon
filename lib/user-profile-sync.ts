/**
 * Ensures every sign-in has a profile in io2026Hackathon_users (and active users collection).
 * Migrates legacy hackatonUsers on first sign-in; falls back to ensureUserProfile Cloud Function.
 */
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, type DocumentData } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { USERS_COLLECTION } from "./constants";
import {
  getActiveDataset,
  IO2026_COLLECTIONS,
  LEGACY_COLLECTIONS,
} from "./hackathon-collections";
import { getActiveHackathonId } from "./active-hackathon";
import { isBootstrapAdminEmail } from "./bootstrap-admins";

type UserRole = "admin" | "moderator" | "user";

/** Always upsert IO 2026 users here (even if env misconfigured). */
export const IO2026_USERS_COLLECTION = IO2026_COLLECTIONS.users;

const PROFILE_FIELD_KEYS = [
  "hackathonBio",
  "hackathonLinkedinUrl",
  "skills",
  "interests",
  "expertise",
  "techStack",
  "twitterUrl",
  "facebookUrl",
  "instagramUrl",
  "teamPreference",
  "inPersonAttendance",
  "profileCompletionPercent",
  "profileDisplayName",
  "city",
  "country",
  "experienceLevel",
  "programmingSkills",
  "domainExpertise",
  "wantToLearnTags",
  "canOfferTags",
  "githubUrl",
  "websiteUrl",
  "buddiesVisibleInDirectory",
] as const;

function pickProfileFields(data: DocumentData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PROFILE_FIELD_KEYS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

function resolveRole(email: string | null | undefined, existing?: string): UserRole {
  if (isBootstrapAdminEmail(email)) return "admin";
  if (existing === "admin" || existing === "moderator") return existing;
  return "user";
}

function mergeParticipations(
  existing: Record<string, { joinedAt?: unknown }> | undefined,
  hackathonId: string,
  now: Date
): Record<string, { joinedAt: Date }> {
  const base =
    existing && typeof existing === "object" ? { ...existing } : ({} as Record<string, { joinedAt?: unknown }>);
  if (!base[hackathonId]?.joinedAt) {
    base[hackathonId] = { joinedAt: now };
  }
  return base as Record<string, { joinedAt: Date }>;
}

function activeUsersCollection(): string {
  return getActiveDataset() === "io2026" ? IO2026_USERS_COLLECTION : LEGACY_COLLECTIONS.users;
}

async function loadLegacySeed(uid: string): Promise<DocumentData | undefined> {
  const legacySnap = await getDoc(doc(db, LEGACY_COLLECTIONS.users, uid));
  return legacySnap.exists() ? legacySnap.data() : undefined;
}

async function writeUserProfileDoc(
  collectionName: string,
  user: User,
  existingSnap: { exists: () => boolean; data: () => DocumentData | undefined },
  legacySeed?: DocumentData
): Promise<void> {
  const ref = doc(db, collectionName, user.uid);
  const now = new Date();
  const hackathonId = getActiveHackathonId();
  const from = legacySeed || {};

  if (!existingSnap.exists()) {
    const participations = mergeParticipations(
      from.hackathonParticipations as Record<string, { joinedAt?: unknown }> | undefined,
      hackathonId,
      now
    );
    await setDoc(ref, {
      ...pickProfileFields(from),
      uid: user.uid,
      email: user.email ?? from.email ?? null,
      displayName:
        user.displayName ||
        (from.displayName as string) ||
        user.email?.split("@")[0] ||
        "User",
      role: resolveRole(user.email, from.role as string | undefined),
      hackathonParticipations: participations,
      createdAt: from.createdAt ?? now,
      updatedAt: now,
      createdBy: (from.createdBy as string) || user.uid,
      updatedBy: user.uid,
      createdDate: from.createdDate ?? now,
      updatedDate: now,
      ...(legacySeed
        ? { migratedFromLegacyAt: now, migratedFrom: LEGACY_COLLECTIONS.users }
        : {}),
    });
    return;
  }

  const data = existingSnap.data()!;
  const updates: Record<string, unknown> = {
    email: user.email,
    displayName: user.displayName || data.displayName,
    updatedAt: now,
    updatedBy: user.uid,
    updatedDate: now,
    hackathonParticipations: mergeParticipations(
      data.hackathonParticipations as Record<string, { joinedAt?: unknown }> | undefined,
      hackathonId,
      now
    ),
  };
  if (isBootstrapAdminEmail(user.email)) {
    updates.role = "admin";
  }
  await setDoc(ref, updates, { merge: true });
}

/** Callable backup — Admin SDK write to io2026Hackathon_users (deploy: functions:ensureUserProfile). */
export async function ensureUserProfileViaCallable(): Promise<void> {
  const fn = httpsCallable<Record<string, never>, { ok: boolean }>(functions, "ensureUserProfile");
  await fn({});
}

/**
 * Create or update Firestore user profile on sign-in / registration.
 */
export async function ensureUserProfileOnSignIn(user: User): Promise<void> {
  if (!user?.uid) {
    throw new Error("ensureUserProfileOnSignIn: missing uid");
  }

  const primaryCol = activeUsersCollection();
  const ioRef = doc(db, IO2026_USERS_COLLECTION, user.uid);
  const ioSnap = await getDoc(ioRef);

  let legacySeed: DocumentData | undefined;
  if (!ioSnap.exists()) {
    legacySeed = await loadLegacySeed(user.uid);
  }

  // Always ensure IO 2026 doc (live hackathon directory + admin users list)
  await writeUserProfileDoc(IO2026_USERS_COLLECTION, user, ioSnap, legacySeed);

  // Legacy dataset mode: keep hackatonUsers in sync too
  if (primaryCol !== IO2026_USERS_COLLECTION) {
    const primaryRef = doc(db, primaryCol, user.uid);
    const primarySnap = await getDoc(primaryRef);
    await writeUserProfileDoc(primaryCol, user, primarySnap, legacySeed);
  }
}

/**
 * Client sync + callable fallback if profile still missing.
 */
export async function syncUserProfileOnAuth(user: User): Promise<void> {
  let clientError: unknown;
  try {
    await ensureUserProfileOnSignIn(user);
  } catch (e) {
    clientError = e;
    console.warn("[syncUserProfile] client write failed:", e);
  }

  const snap = await getDoc(doc(db, IO2026_USERS_COLLECTION, user.uid));

  if (!snap.exists()) {
    try {
      await ensureUserProfileViaCallable();
    } catch (callableErr) {
      console.error("[syncUserProfile] callable failed:", callableErr);
      if (clientError) throw clientError;
      throw callableErr;
    }
  }
}
