import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { USERS_COLLECTION, BOOKMARKS_SUBCOLLECTION, PROJECTS_COLLECTION } from "./constants";

export async function toggleBookmark(userId: string, projectId: string): Promise<boolean> {
  const bookmarkRef = doc(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION, projectId);
  const snap = await getDoc(bookmarkRef);
  if (snap.exists()) {
    await deleteDoc(bookmarkRef);
    return false;
  }
  const now = new Date();
  await setDoc(bookmarkRef, {
    projectId,
    createdAt: now,
    createdBy: userId,
    updatedBy: userId,
    createdDate: now,
    updatedDate: now,
  });
  return true;
}

export async function isBookmarked(userId: string, projectId: string): Promise<boolean> {
  const bookmarkRef = doc(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION, projectId);
  const snap = await getDoc(bookmarkRef);
  return snap.exists();
}

export async function getBookmarkedProjectIds(userId: string): Promise<string[]> {
  const bookmarksRef = collection(db, USERS_COLLECTION, userId, BOOKMARKS_SUBCOLLECTION);
  const snapshot = await getDocs(bookmarksRef);
  return snapshot.docs.map((d) => d.data().projectId).filter(Boolean);
}
