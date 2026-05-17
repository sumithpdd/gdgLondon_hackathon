import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Bearer token for /api/* routes. Forces refresh so long-lived admin tabs (e.g. iOS) do not 401.
 */
export async function getBearerAuthHeaders(user?: User | null): Promise<HeadersInit> {
  const u = user ?? auth.currentUser;
  if (!u) throw new Error("Sign in required");
  const token = await u.getIdToken(true);
  return { Authorization: `Bearer ${token}` };
}
