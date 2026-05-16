import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { SETTINGS_COLLECTION, SETTINGS_DOC_ID } from "./constants";

export interface HackathonConfig {
  winnersAnnounced: boolean;
  winnersAnnouncedAt?: Date;
  winnersAnnouncedBy?: string;
}

export async function getHackathonConfig(): Promise<HackathonConfig> {
  const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
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
  const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(ref, {
    winnersAnnounced: true,
    winnersAnnouncedAt: Timestamp.now(),
    winnersAnnouncedBy: adminUid,
  }, { merge: true });
}
