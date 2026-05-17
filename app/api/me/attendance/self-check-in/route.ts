/**
 * POST /api/me/attendance/self-check-in
 *
 * Body: { code: string } — validates against hashed secret in Firestore (Admin SDK).
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, ok, err, isErrorResponse } from "@/lib/api-helpers";
import { logServerRouteException } from "@/lib/server/appErrorLog";
import {
  ATTENDANCE_COLLECTION,
  CHECKIN_PUBLIC_DOC_ID,
  CHECKIN_SECRETS_DOC_ID,
  SETTINGS_COLLECTION,
  USERS_COLLECTION,
} from "@/lib/constants";
import { hashCheckInCode, normalizeCheckInCode } from "@/lib/server/checkInCode";
import { isEventSelfCheckInWindowOpen, type CheckInPublicFields } from "@/lib/server/checkInWindow";
import {
  isSelfCheckInRateLimited,
  recordSelfCheckInFailure,
} from "@/lib/server/selfCheckInRateLimit";
import { writeAttendanceVerified } from "@/lib/server/writeAttendance";
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = (await request.json()) as { code?: string };
    const normalized = normalizeCheckInCode(body.code || "");
    if (!/^\d{6}$/.test(normalized)) {
      return err("Enter the 6-digit check-in code.", 400);
    }

    const userSnap = await adminDb().collection(USERS_COLLECTION).doc(auth.uid).get();
    if (userSnap.exists && userSnap.data()?.deletedAt != null) {
      return err("Your account is not eligible for check-in.", 403);
    }

    if (isSelfCheckInRateLimited(auth.uid)) {
      return err("Too many attempts. Try again in a few minutes.", 429);
    }

    const publicSnap = await adminDb()
      .collection(SETTINGS_COLLECTION)
      .doc(CHECKIN_PUBLIC_DOC_ID)
      .get();
    const publicCfg = publicSnap.exists ? (publicSnap.data() as CheckInPublicFields) : undefined;

    if (!isEventSelfCheckInWindowOpen(publicCfg)) {
      return err("Check-in is not open right now.", 400);
    }

    const attRef = adminDb().collection(ATTENDANCE_COLLECTION).doc(auth.uid);
    const attSnap = await attRef.get();
    if (attSnap.exists && attSnap.data()?.attendanceVerified === true) {
      return ok({ alreadyMarked: true });
    }

    const secretsSnap = await adminDb()
      .collection(SETTINGS_COLLECTION)
      .doc(CHECKIN_SECRETS_DOC_ID)
      .get();
    const storedHash = secretsSnap.data()?.codeHash as string | undefined;
    if (!storedHash || storedHash !== hashCheckInCode(normalized)) {
      recordSelfCheckInFailure(auth.uid);
      return err("Incorrect check-in code.", 400);
    }

    await writeAttendanceVerified({
      targetUid: auth.uid,
      actorUid: auth.uid,
      method: "self",
    });

    return ok({ marked: true });
  } catch (e) {
    logServerRouteException("POST /api/me/attendance/self-check-in", e);
    return err("Check-in failed", 500);
  }
}
