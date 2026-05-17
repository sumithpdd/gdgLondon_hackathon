import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ATTENDANCE_COLLECTION } from "@/lib/constants";

export async function writeAttendanceVerified(params: {
  targetUid: string;
  actorUid: string;
  method: "self" | "staff";
  cohort?: string | null;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    userId: params.targetUid,
    checkedInAt: FieldValue.serverTimestamp(),
    checkedInByUid: params.actorUid,
    method: params.method,
    attendanceVerified: true,
  };
  if (params.method === "staff" && params.cohort) {
    payload.cohort = params.cohort;
  }
  await adminDb().collection(ATTENDANCE_COLLECTION).doc(params.targetUid).set(payload, { merge: true });
}
