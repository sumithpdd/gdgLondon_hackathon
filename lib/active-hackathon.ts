/**
 * Logical hackathon instance users join (metadata in `hackathons` collection).
 * Firestore project data still follows NEXT_PUBLIC_HACKATHON_DATASET (io2026 vs legacy).
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import {
  BUILD_WITH_AI_EVENT_DESCRIPTION,
  HACKATHON_DISPLAY_NAME,
  HACKATHONS_COLLECTION,
} from "./constants";
import { getActiveDataset } from "./hackathon-collections";
import type { HackathonRegistryRecord } from "./hackathons-registry";

export function getActiveHackathonId(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_ID?.trim()) {
    return process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_ID.trim();
  }
  return "io2026Hackathon";
}

export function getActiveHackathonName(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_ACTIVE_HACKATHON_NAME.trim();
  }
  return HACKATHON_DISPLAY_NAME;
}

/** Hide internal registry blurbs (e.g. "Google I/O 2026 extended hackathon (io2026Hackathon)"). */
export function normalizeHackathonEventDescription(description: string | undefined): string {
  const text = description?.trim() ?? "";
  if (!text) return BUILD_WITH_AI_EVENT_DESCRIPTION;
  if (/io2026hackathon/i.test(text) && /extended hackathon/i.test(text)) {
    return BUILD_WITH_AI_EVENT_DESCRIPTION;
  }
  return text;
}

function docToEvent(id: string, data: Record<string, unknown>): HackathonRegistryRecord {
  const rawDescription =
    typeof data.description === "string" ? data.description : undefined;
  return {
    id,
    slug: (data.slug as string) || id,
    displayName: (data.displayName as string) || getActiveHackathonName(),
    description: normalizeHackathonEventDescription(rawDescription),
    dataCollectionKey: (data.dataCollectionKey as "io2026" | "legacy") || getActiveDataset(),
    createdBy: data.createdBy as string | undefined,
  };
}

/** Active edition metadata from `hackathons/{getActiveHackathonId()}`. */
export async function getActiveHackathonEvent(): Promise<HackathonRegistryRecord> {
  const id = getActiveHackathonId();
  try {
    const snap = await getDoc(doc(db, HACKATHONS_COLLECTION, id));
    if (snap.exists()) {
      return docToEvent(id, snap.data() as Record<string, unknown>);
    }
  } catch (e) {
    console.error("getActiveHackathonEvent:", e);
  }
  return {
    id,
    slug: id,
    displayName: getActiveHackathonName(),
    description: BUILD_WITH_AI_EVENT_DESCRIPTION,
    dataCollectionKey: getActiveDataset(),
  };
}

/** Admin: create or merge the active hackathon registry doc (incl. Build with AI description). */
export async function ensureActiveHackathonRegistry(createdBy: string): Promise<void> {
  const id = getActiveHackathonId();
  await setDoc(
    doc(db, HACKATHONS_COLLECTION, id),
    {
      slug: id,
      displayName: getActiveHackathonName(),
      description: BUILD_WITH_AI_EVENT_DESCRIPTION,
      dataCollectionKey: getActiveDataset(),
      createdBy,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
