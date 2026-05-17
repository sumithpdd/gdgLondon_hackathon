/**
 * Parse FIREBASE_ADMIN_PRIVATE_KEY from .env / Vercel (escaped \\n, quotes, or real newlines).
 */
export function normalizeAdminPrivateKey(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;

  let key = raw.trim();

  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  if (key.includes("...") || key.length < 400) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY looks truncated or placeholder. Paste the full private_key from your service account JSON."
    );
  }

  if (!key.includes("-----BEGIN PRIVATE KEY-----") || !key.includes("-----END PRIVATE KEY-----")) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY must be a PEM private key.");
  }

  return key;
}
