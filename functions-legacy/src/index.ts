/**
 * Gen-1 Cloud Functions for the photobooth app on the shared Firebase project.
 * Kept in-repo so `firebase deploy --only functions` does not delete remote handlers.
 *
 * Replace implementations from the photobooth repo when you change behaviour.
 */
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

/** HTTP health probe used by hosting / monitors. */
export const healthCheck = functions.https.onRequest((_req, res) => {
  res.status(200).json({ status: "ok", service: "photobooth-legacy" });
});

/**
 * Queues email for the Firestore Send Email extension (ext-firestore-send-email).
 * Adjust field names if your extension expects a different schema.
 */
export const sendEmail = functions.https.onCall(async (data) => {
  const payload = (data ?? {}) as Record<string, unknown>;
  await db.collection("mail").add({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

/** Admin utility — extend with real seed data from the photobooth repo if needed. */
export const seedBackgrounds = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required.");
  }
  functions.logger.info("seedBackgrounds called — no-op preserve deploy");
  return { success: true, seeded: 0 };
});

/**
 * Gemini photo processing (2GB). Preserves deploy slot; implement via photobooth repo source.
 * Until replaced, returns a clear error instead of being deleted on deploy.
 */
export const processPhotoWithGemini = functions
  .runWith({ memory: "2GB", timeoutSeconds: 120 })
  .https.onCall(async () => {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "processPhotoWithGemini source not synced — deploy from the photobooth functions repo or update functions-legacy/src/index.ts."
    );
  });

/** Deletes Storage object when a photobooth/{docId} document is removed. */
export const cleanupPhotoStorage = functions.firestore
  .document("photobooth/{docId}")
  .onDelete(async (snap) => {
    const data = snap.data() as { storagePath?: string; imagePath?: string } | undefined;
    const objectPath = data?.storagePath || data?.imagePath;
    if (!objectPath || typeof objectPath !== "string") return;
    try {
      await bucket.file(objectPath.replace(/^\//, "")).delete({ ignoreNotFound: true });
    } catch (e) {
      functions.logger.warn("cleanupPhotoStorage failed", { objectPath, e });
    }
  });
