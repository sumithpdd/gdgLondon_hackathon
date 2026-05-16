import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HACKATHONS_COLLECTION } from "@/lib/constants";

export interface HackathonRegistryRecord {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  /** Matches NEXT_PUBLIC_HACKATHON_DATASET / collection family (io2026 | legacy). */
  dataCollectionKey: "io2026" | "legacy";
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

function docToRecord(id: string, data: Record<string, unknown>): HackathonRegistryRecord {
  return {
    id,
    slug: (data.slug as string) || id,
    displayName: (data.displayName as string) || id,
    description: data.description as string | undefined,
    dataCollectionKey: (data.dataCollectionKey as "io2026" | "legacy") || "io2026",
    createdAt:
      data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
        ? (data.createdAt as { toDate: () => Date }).toDate()
        : undefined,
    updatedAt:
      data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
        ? (data.updatedAt as { toDate: () => Date }).toDate()
        : undefined,
    createdBy: data.createdBy as string | undefined,
  };
}

export async function listHackathons(): Promise<HackathonRegistryRecord[]> {
  const snap = await getDocs(collection(db, HACKATHONS_COLLECTION));
  return snap.docs
    .map((d) => docToRecord(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createHackathon(input: {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  dataCollectionKey: "io2026" | "legacy";
  createdBy: string;
}): Promise<void> {
  const id = input.id.trim().replace(/\s+/g, "-");
  if (!id) throw new Error("Hackathon id is required");
  await setDoc(
    doc(db, HACKATHONS_COLLECTION, id),
    {
      slug: input.slug.trim() || id,
      displayName: input.displayName.trim(),
      description: input.description?.trim() || "",
      dataCollectionKey: input.dataCollectionKey,
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
