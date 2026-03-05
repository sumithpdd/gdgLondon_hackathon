import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { PROJECTS_COLLECTION, COMMENTS_SUBCOLLECTION } from "./constants";
import type { Comment } from "@/types/comment";

export async function addComment(
  projectId: string,
  text: string,
  userId: string,
  userEmail: string,
  displayName: string
): Promise<string> {
  const commentsRef = collection(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION);
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  const now = Timestamp.now();
  const docRef = await addDoc(commentsRef, {
    projectId,
    userId,
    userEmail,
    displayName,
    text,
    createdAt: now,
    createdBy: userId,
    updatedBy: userId,
    createdDate: now,
    updatedDate: now,
  });

  await updateDoc(projectRef, { commentCount: increment(1) });
  return docRef.id;
}

export async function getComments(projectId: string): Promise<Comment[]> {
  const commentsRef = collection(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION);
  const q = query(commentsRef, orderBy("createdAt", "asc"));
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
  }) as Comment[];
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  const commentRef = doc(db, PROJECTS_COLLECTION, projectId, COMMENTS_SUBCOLLECTION, commentId);
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(commentRef);
  const projectSnap = await getDoc(projectRef);
  const current = projectSnap.data()?.commentCount ?? 0;
  await updateDoc(projectRef, { commentCount: Math.max(0, current - 1) });
}
