import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const CONFIG_COLLECTION = "hackatonConfig";
const CONFIG_DOC = "settings";

export interface HackathonConfig {
  winnersAnnounced: boolean;
  winnersAnnouncedAt?: Date;
  winnersAnnouncedBy?: string;
}

export async function getHackathonConfig(): Promise<HackathonConfig> {
  const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { winnersAnnounced: false };
  }
  const data = snap.data();
  return {
    winnersAnnounced: data.winnersAnnounced ?? false,
    winnersAnnouncedAt: data.winnersAnnouncedAt?.toDate?.(),
    winnersAnnouncedBy: data.winnersAnnouncedBy,
  };
}

export async function announceWinners(adminUid: string): Promise<void> {
  const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
  await setDoc(ref, {
    winnersAnnounced: true,
    winnersAnnouncedAt: Timestamp.now(),
    winnersAnnouncedBy: adminUid,
  }, { merge: true });
}
