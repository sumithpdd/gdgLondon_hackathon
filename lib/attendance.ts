import { doc, getDoc, setDoc, serverTimestamp, deleteField } from "firebase/firestore";
import { db } from "./firebase";
import { ATTENDANCE_COLLECTION } from "./constants";

export type AttendanceCohort = "aidevcamp_flat" | null;

export type AttendanceDoc = {
  userId: string;
  checkedInAt: unknown;
  checkedInByUid: string;
  method: "self" | "admin";
  attendanceVerified: boolean;
  cohort?: AttendanceCohort;
};

/** One attendance doc per attendee (`docId === userId`) for simple reads. */
export async function getAttendanceForUser(uid: string): Promise<AttendanceDoc | null> {
  const snap = await getDoc(doc(db, ATTENDANCE_COLLECTION, uid));
  if (!snap.exists()) return null;
  return snap.data() as AttendanceDoc;
}

export async function upsertCheckIn(params: {
  targetUid: string;
  actorUid: string;
  isAdminActor: boolean;
  cohort?: AttendanceCohort;
}): Promise<void> {
  const { targetUid, actorUid, isAdminActor, cohort } = params;
  if (!isAdminActor && targetUid !== actorUid) {
    throw new Error("You can only check yourself in.");
  }
  const ref = doc(db, ATTENDANCE_COLLECTION, targetUid);
  await setDoc(
    ref,
    {
      userId: targetUid,
      checkedInAt: serverTimestamp(),
      checkedInByUid: isAdminActor ? actorUid : targetUid,
      method: isAdminActor ? "admin" : "self",
      attendanceVerified: true,
      ...(isAdminActor ? (cohort ? { cohort } : { cohort: deleteField() }) : {}),
    },
    { merge: true }
  );
}
