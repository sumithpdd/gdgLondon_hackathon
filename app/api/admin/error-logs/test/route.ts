import { NextRequest } from "next/server";
import { ok, err, requireAdmin, isErrorResponse } from "@/lib/api-helpers";
import { insertErrorLog } from "@/lib/server/appErrorLog";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) return auth;

  const id = await insertErrorLog({
    source: "test",
    message: "Test entry from /admin/errors — the error_logs collection is working.",
    name: "TestLog",
    path: "/api/admin/error-logs/test",
    userId: auth.uid,
    userEmail: auth.email ?? null,
  });
  if (!id) {
    return err("Could not write to error_logs (check Firebase Admin credentials)", 500);
  }
  return ok({ id });
}
