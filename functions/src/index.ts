import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

const PROJECTS_COLLECTION = "hackatonProjects";
const USERS_COLLECTION = "hackatonUsers";
const JOIN_REQUESTS_COLLECTION = "hackatonJoinRequests";
const CONFIG_COLLECTION = "hackatonConfig";
const CONFIG_DOC = "settings";

// ── helpers ──────────────────────────────────────────────

async function assertAdmin(uid: string): Promise<void> {
  const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

async function getUserProject(
  userId: string
): Promise<{ projectId: string; role: "owner" | "member" } | null> {
  const ownerSnap = await db
    .collection(PROJECTS_COLLECTION)
    .where("userId", "==", userId)
    .limit(1)
    .get();
  if (!ownerSnap.empty) {
    return { projectId: ownerSnap.docs[0].id, role: "owner" };
  }

  const memberSnap = await db
    .collection(JOIN_REQUESTS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "approved")
    .limit(1)
    .get();
  if (!memberSnap.empty) {
    return { projectId: memberSnap.docs[0].data().projectId, role: "member" };
  }

  return null;
}

// ── 1. setWinnerPlace ────────────────────────────────────

export const setWinnerPlace = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  const { projectId, place } = request.data as {
    projectId: string;
    place: string | null;
  };
  if (!projectId) throw new HttpsError("invalid-argument", "projectId is required.");

  const validPlaces = ["first", "second", "third", null, ""];
  if (!validPlaces.includes(place ?? null)) {
    throw new HttpsError("invalid-argument", "Invalid place value.");
  }

  // Check winners not already announced
  const configSnap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
  if (configSnap.exists && configSnap.data()?.winnersAnnounced) {
    throw new HttpsError("failed-precondition", "Winners already announced. Cannot change places.");
  }

  await db.collection(PROJECTS_COLLECTION).doc(projectId).update({
    place: place || null,
    updatedBy: uid,
    updatedDate: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ── 2. announceWinners ───────────────────────────────────

export const announceWinners = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  // Check not already announced
  const configSnap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
  if (configSnap.exists && configSnap.data()?.winnersAnnounced) {
    throw new HttpsError("failed-precondition", "Winners already announced.");
  }

  // Validate all 3 places are assigned
  const projects = await db.collection(PROJECTS_COLLECTION).get();
  const places: Record<string, string> = {};
  projects.docs.forEach((d) => {
    const p = d.data().place;
    if (p && ["first", "second", "third"].includes(p)) {
      places[p] = d.id;
    }
  });
  if (!places.first || !places.second || !places.third) {
    throw new HttpsError(
      "failed-precondition",
      "All three places (first, second, third) must be assigned before announcing."
    );
  }

  await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set(
    {
      winnersAnnounced: true,
      winnersAnnouncedAt: admin.firestore.FieldValue.serverTimestamp(),
      winnersAnnouncedBy: uid,
    },
    { merge: true }
  );

  return { success: true };
});

// ── 3. createProject ─────────────────────────────────────

export const createProject = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  // Enforce one-project-per-user
  const existing = await getUserProject(uid);
  if (existing) {
    throw new HttpsError(
      "already-exists",
      existing.role === "owner"
        ? "You already own a project."
        : "You are already a member of another project."
    );
  }

  const data = request.data as Record<string, unknown>;

  // Strip fields that only Cloud Functions / admin should set
  delete data.place;
  delete data.likes;
  delete data.views;
  delete data.likesBy;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = await db.collection(PROJECTS_COLLECTION).add({
    ...data,
    userId: uid,
    userEmail: request.auth?.token.email || "",
    createdAt: now,
    createdBy: uid,
    createdDate: now,
    updatedAt: now,
    updatedBy: uid,
    updatedDate: now,
    place: null,
    likes: 0,
    views: 0,
  });

  return { projectId: ref.id };
});

// ── 4. createJoinRequest ─────────────────────────────────

export const createJoinRequest = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  // Enforce one-project-per-user
  const existing = await getUserProject(uid);
  if (existing) {
    throw new HttpsError(
      "already-exists",
      existing.role === "owner"
        ? "You already own a project."
        : "You are already a member of another project."
    );
  }

  const { projectId, projectTitle, message } = request.data as {
    projectId: string;
    projectTitle: string;
    message?: string;
  };
  if (!projectId || !projectTitle) {
    throw new HttpsError("invalid-argument", "projectId and projectTitle are required.");
  }

  // Check for existing pending request
  const pendingSnap = await db
    .collection(JOIN_REQUESTS_COLLECTION)
    .where("projectId", "==", projectId)
    .where("userId", "==", uid)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!pendingSnap.empty) {
    throw new HttpsError("already-exists", "You already have a pending request for this project.");
  }

  const ref = await db.collection(JOIN_REQUESTS_COLLECTION).add({
    projectId,
    projectTitle,
    userId: uid,
    userEmail: request.auth?.token.email || "",
    userName: request.auth?.token.name || "",
    status: "pending",
    message: message || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { requestId: ref.id };
});

// ── 5. handleJoinRequest ─────────────────────────────────

export const handleJoinRequest = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { requestId, action } = request.data as {
    requestId: string;
    action: "approve" | "reject";
  };
  if (!requestId || !["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "requestId and action (approve/reject) required.");
  }

  const reqRef = db.collection(JOIN_REQUESTS_COLLECTION).doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new HttpsError("not-found", "Join request not found.");
  }
  const reqData = reqSnap.data()!;

  if (reqData.status !== "pending") {
    throw new HttpsError("failed-precondition", "This request has already been handled.");
  }

  // Verify caller is the project owner
  const projectRef = db.collection(PROJECTS_COLLECTION).doc(reqData.projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }
  if (projectSnap.data()?.userId !== uid) {
    throw new HttpsError("permission-denied", "Only the project owner can handle join requests.");
  }

  if (action === "approve") {
    // Enforce one-project-per-user for the requesting user
    const existingProject = await getUserProject(reqData.userId);
    if (existingProject) {
      throw new HttpsError(
        "failed-precondition",
        "This user is already part of another project."
      );
    }

    await reqRef.update({
      status: "approved",
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await projectRef.update({
      teamMembers: admin.firestore.FieldValue.arrayUnion({
        name: reqData.userName,
        email: reqData.userEmail,
      }),
    });
  } else {
    await reqRef.update({
      status: "rejected",
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true };
});

// ── 6. deleteProject ─────────────────────────────────────

export const deleteProject = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  const { projectId } = request.data as { projectId: string };
  if (!projectId) throw new HttpsError("invalid-argument", "projectId is required.");

  const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  // Delete all join requests for this project
  const joinRequests = await db
    .collection(JOIN_REQUESTS_COLLECTION)
    .where("projectId", "==", projectId)
    .get();
  const batch = db.batch();
  joinRequests.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(projectRef);
  await batch.commit();

  return { success: true };
});

// ── 7. resetHackathon ────────────────────────────────────

export const resetHackathon = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  // Delete all projects (in batches of 500 — Firestore limit)
  const projects = await db.collection(PROJECTS_COLLECTION).get();
  for (let i = 0; i < projects.docs.length; i += 500) {
    const batch = db.batch();
    projects.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Delete all join requests
  const joinRequests = await db.collection(JOIN_REQUESTS_COLLECTION).get();
  for (let i = 0; i < joinRequests.docs.length; i += 500) {
    const batch = db.batch();
    joinRequests.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Reset config
  await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set({
    winnersAnnounced: false,
  });

  return { success: true };
});
