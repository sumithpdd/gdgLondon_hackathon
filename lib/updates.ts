import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { UPDATES_COLLECTION } from "./constants";
import type { HackathonUpdate } from "@/types/update";

export async function createUpdate(
  title: string,
  body: string,
  authorId: string,
  authorName: string
): Promise<string> {
  const ref = collection(db, UPDATES_COLLECTION);
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    title,
    body,
    authorId,
    authorName,
    createdAt: now,
    createdBy: authorId,
    updatedBy: authorId,
    createdDate: now,
    updatedDate: now,
  });
  return docRef.id;
}

export async function getUpdates(): Promise<HackathonUpdate[]> {
  const ref = collection(db, UPDATES_COLLECTION);
  const q = query(ref, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.(),
      createdDate: data.createdDate?.toDate?.(),
      updatedDate: data.updatedDate?.toDate?.(),
    };
  }) as HackathonUpdate[];
}
