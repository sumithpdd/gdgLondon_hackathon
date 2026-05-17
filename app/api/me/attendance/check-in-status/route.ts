/**
 * GET /api/me/attendance/check-in-status
 *
 * Event-level self check-in window (no code exposed).
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, ok, err, isErrorResponse } from "@/lib/api-helpers";
import { logServerRouteException } from "@/lib/server/appErrorLog";
import {
  ATTENDANCE_COLLECTION,
  CHECKIN_PUBLIC_DOC_ID,
  SETTINGS_COLLECTION,
  USERS_COLLECTION,
} from "@/lib/constants";
import {
  eventCheckInWindowIso,
  isEventSelfCheckInWindowOpen,
  type CheckInPublicFields,
} from "@/lib/server/checkInWindow";
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const userSnap = await adminDb().collection(USERS_COLLECTION).doc(auth.uid).get();
    if (userSnap.exists && userSnap.data()?.deletedAt != null) {
      return ok({
        eligible: false,
        active: false,
        checkedIn: false,
        selfCheckInEnabled: false,
        opensAt: null,
        closesAt: null,
      });
    }

    const cfgSnap = await adminDb()
      .collection(SETTINGS_COLLECTION)
      .doc(CHECKIN_PUBLIC_DOC_ID)
      .get();
    const cfg = cfgSnap.exists ? (cfgSnap.data() as CheckInPublicFields) : undefined;
    const { opensAt, closesAt } = eventCheckInWindowIso(cfg);
    const active = isEventSelfCheckInWindowOpen(cfg);

    const attSnap = await adminDb().collection(ATTENDANCE_COLLECTION).doc(auth.uid).get();
    const checkedIn = attSnap.exists && attSnap.data()?.attendanceVerified === true;

    return ok({
      eligible: true,
      active,
      checkedIn,
      selfCheckInEnabled: cfg?.selfCheckInEnabled === true,
      opensAt,
      closesAt,
    });
  } catch (e) {
    logServerRouteException("GET /api/me/attendance/check-in-status", e);
    return err("Failed to load check-in status", 500);
  }
}
