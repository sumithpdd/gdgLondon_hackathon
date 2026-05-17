import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION } from "@/lib/constants";
import { getActiveHackathonId } from "@/lib/active-hackathon";

export type ParticipationProfile = {
  hackathonParticipations?: Record<string, { joinedAt?: Date }>;
};

/** True when the user is registered for the active hackathon edition (io2026Hackathon by default). */
export function hasHackathonParticipation(
  profile: ParticipationProfile | null | undefined,
  hackathonId: string = getActiveHackathonId()
): boolean {
  return Boolean(profile?.hackathonParticipations?.[hackathonId]?.joinedAt);
}

/**
 * Marks the user as participating in the active hackathon (metadata only).
 * Merges into `hackathonParticipations` map: { [hackathonId]: { joinedAt } }.
 */
export async function recordHackathonParticipationIfNeeded(uid: string): Promise<void> {
  const hackathonId = getActiveHackathonId();
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const existing = snap.data()?.hackathonParticipations as Record<string, { joinedAt?: unknown }> | undefined;
  if (existing?.[hackathonId]?.joinedAt) return;

  const now = new Date();
  await setDoc(
    userRef,
    {
      hackathonParticipations: {
        ...(existing && typeof existing === "object" ? existing : {}),
        [hackathonId]: { joinedAt: now },
      },
      updatedAt: now,
      updatedBy: uid,
      updatedDate: now,
    },
    { merge: true }
  );
}
