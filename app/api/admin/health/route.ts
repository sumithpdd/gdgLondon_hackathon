import { NextRequest } from "next/server";
import { getAdminEnvStatus } from "@/lib/firebase-admin";
import { ok, err, verifyAuth, isErrorResponse } from "@/lib/api-helpers";

/**
 * GET /api/admin/health
 * Returns Firebase Admin env status (no secrets). If Bearer token sent, also verifies sign-in.
 */
export async function GET(request: NextRequest) {
  const env = getAdminEnvStatus();
  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  const hasAuth = (request.headers.get("authorization") ?? "").startsWith("Bearer ");
  if (!hasAuth) {
    return ok({
      env,
      clientProject,
      projectsMatch:
        !env.projectId || !clientProject || env.projectId === clientProject,
      tokenVerified: false,
    });
  }

  const auth = await verifyAuth(request);
  if (isErrorResponse(auth)) {
    return ok({
      env,
      clientProject,
      projectsMatch:
        !env.projectId || !clientProject || env.projectId === clientProject,
      tokenVerified: false,
      tokenError: auth.status === 401 ? "invalid_or_expired" : "forbidden",
    });
  }

  if (auth.role !== "admin") {
    return err("Forbidden — admin role required", 403);
  }

  return ok({
    env,
    clientProject,
    projectsMatch:
      !env.projectId || !clientProject || env.projectId === clientProject,
    tokenVerified: true,
    uid: auth.uid,
    role: auth.role,
  });
}
