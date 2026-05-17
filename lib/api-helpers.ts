import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { IO2026_COLLECTIONS, LEGACY_COLLECTIONS } from "@/lib/hackathon-collections";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export type AuthResult = {
  uid: string;
  email: string | undefined;
  role: string;
};

export function isErrorResponse(res: AuthResult | NextResponse): res is NextResponse {
  return res instanceof NextResponse;
}

async function readRole(uid: string): Promise<string> {
  const db = adminDb();
  const ioSnap = await db.collection(IO2026_COLLECTIONS.users).doc(uid).get();
  if (ioSnap.exists) {
    return String(ioSnap.data()?.role ?? "user");
  }
  const legacySnap = await db.collection(LEGACY_COLLECTIONS.users).doc(uid).get();
  if (legacySnap.exists) {
    return String(legacySnap.data()?.role ?? "user");
  }
  return "user";
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return err("Missing Authorization header", 401);
  }
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const role = await readRole(decoded.uid);
    return { uid: decoded.uid, email: decoded.email, role };
  } catch {
    return err("Invalid or expired token", 401);
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult | NextResponse> {
  const result = await verifyAuth(request);
  if (isErrorResponse(result)) return result;
  if (result.role !== "admin") {
    return err("Forbidden — admin role required", 403);
  }
  return result;
}
