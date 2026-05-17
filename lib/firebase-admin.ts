/**
 * Firebase Admin SDK — server-only (API routes). Never import in client components.
 *
 * Set in `.env.local` and Vercel:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY  (keep `\n` escaped in env)
 */
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { normalizeAdminPrivateKey } from "@/lib/server/normalizeAdminPrivateKey";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  let privateKey: string | undefined;
  try {
    privateKey = normalizeAdminPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid FIREBASE_ADMIN_PRIVATE_KEY";
    throw new Error(msg);
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

/** Quick check for API diagnostics (no secrets returned). */
export function getAdminEnvStatus(): {
  ok: boolean;
  projectId?: string;
  hasEmail: boolean;
  keyLength: number;
  keyLooksValid: boolean;
  error?: string;
} {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  try {
    normalizeAdminPrivateKey(raw);
    return {
      ok: Boolean(projectId && email),
      projectId,
      hasEmail: Boolean(email),
      keyLength: raw.length,
      keyLooksValid: true,
    };
  } catch (e) {
    return {
      ok: false,
      projectId,
      hasEmail: Boolean(email),
      keyLength: raw.length,
      keyLooksValid: false,
      error: e instanceof Error ? e.message : "Invalid key",
    };
  }
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}
