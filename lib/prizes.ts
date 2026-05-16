import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SETTINGS_COLLECTION, SETTINGS_DOC_ID } from "@/lib/constants";

export interface HackathonPrizeEntry {
  id: string;
  name: string;
  imageSrc: string;
  featured?: boolean;
  sortOrder: number;
}

/** IO 2026 physical prize pool (seeded into settings + used as client fallback). */
export const DEFAULT_IO2026_PRIZES: HackathonPrizeEntry[] = [
  {
    id: "sony-headphones",
    name: "Sony wireless headphones",
    imageSrc: "/Sony_wireless_headphones.png",
    featured: true,
    sortOrder: 0,
  },
  {
    id: "wireless-keyboard",
    name: "Wireless keyboard",
    imageSrc: "/Wireless mechanical gaming keyboard.png",
    featured: true,
    sortOrder: 1,
  },
  {
    id: "bag",
    name: "Bag",
    imageSrc: "/Google_bags.png",
    sortOrder: 2,
  },
  {
    id: "google-socks",
    name: "Google socks",
    imageSrc: "/Google_Socks.png",
    sortOrder: 3,
  },
];

function normalizePrize(raw: unknown, index: number): HackathonPrizeEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : `prize-${index}`;
  const name = typeof o.name === "string" ? o.name : "";
  const imageSrc = typeof o.imageSrc === "string" ? o.imageSrc : "";
  if (!name || !imageSrc) return null;
  return {
    id,
    name,
    imageSrc,
    featured: Boolean(o.featured),
    sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : index,
  };
}

export async function fetchPrizesFromSettings(): Promise<HackathonPrizeEntry[]> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
    if (!snap.exists()) return DEFAULT_IO2026_PRIZES;
    const raw = snap.data()?.prizes;
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_IO2026_PRIZES;
    const parsed = raw
      .map((p, i) => normalizePrize(p, i))
      .filter((p): p is HackathonPrizeEntry => p !== null);
    if (parsed.length === 0) return DEFAULT_IO2026_PRIZES;
    return [...parsed].sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return DEFAULT_IO2026_PRIZES;
  }
}
