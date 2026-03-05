import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { DISCUSSIONS_COLLECTION } from "./constants";
import type { Discussion } from "@/types/discussion";

export async function createDiscussion(
  title: string,
  body: string,
  authorId: string,
  authorName: string
): Promise<string> {
  const ref = collection(db, DISCUSSIONS_COLLECTION);
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    title,
    body,
    authorId,
    authorName,
    createdAt: now,
    updatedAt: now,
    createdBy: authorId,
    updatedBy: authorId,
    createdDate: now,
    updatedDate: now,
  });
  return docRef.id;
}

export async function getDiscussions(): Promise<Discussion[]> {
  const ref = collection(db, DISCUSSIONS_COLLECTION);
  const q = query(ref, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.(),
      updatedAt: data.updatedAt?.toDate?.(),
      createdDate: data.createdDate?.toDate?.(),
      updatedDate: data.updatedDate?.toDate?.(),
    };
  }) as Discussion[];
}
