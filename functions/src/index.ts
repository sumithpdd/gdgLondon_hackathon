import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const PROJECTS_COLLECTION = process.env.PROJECTS_COLLECTION || "hackatonProjects";
const USERS_COLLECTION = process.env.USERS_COLLECTION || "hackatonUsers";
const JOIN_REQUESTS_COLLECTION = process.env.JOIN_REQUESTS_COLLECTION || "hackatonJoinRequests";
const CONFIG_COLLECTION = process.env.CONFIG_COLLECTION || "hackatonConfig";
const CONFIG_DOC = process.env.CONFIG_DOC || "settings";
const VOTES_COLLECTION = process.env.VOTES_COLLECTION || "io2026Hackathon_votes";
const ATTENDANCE_COLLECTION = process.env.ATTENDANCE_COLLECTION || "io2026Hackathon_attendance";
const ACTIVE_HACKATHON_ID = process.env.ACTIVE_HACKATHON_ID || "io2026Hackathon";
const LIVE_STATS_COLLECTION = process.env.LIVE_STATS_COLLECTION || "io2026Hackathon_liveStats";
const LIVE_STATS_DOC = "summary";

const VOTE_BUDGET_ORGANISER = 10;
const VOTE_BUDGET_PARTICIPANT = 5;
const VOTE_MAX_PER_PROJECT = 2;

admin.initializeApp();
const db = admin.firestore();

// ── helpers ──────────────────────────────────────────────

async function assertAdmin(uid: string): Promise<void> {
  const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

function voteBudgetForRole(role: string | undefined): number {
  return role === "admin" || role === "moderator" ? VOTE_BUDGET_ORGANISER : VOTE_BUDGET_PARTICIPANT;
}

function voteDocId(hackathonId: string, userId: string, projectId: string): string {
  return `${hackathonId}_${userId}_${projectId}`;
}

async function assertVotingOpen(): Promise<Record<string, unknown>> {
  const configSnap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
  const settings = configSnap.data() || {};
  if (settings.winnersAnnounced) {
    throw new HttpsError("failed-precondition", "Winners announced; voting is closed.");
  }
  const now = Date.now();
  const opens = settings.votingOpensAt?.toMillis?.() ?? null;
  const closes = settings.votingClosesAt?.toMillis?.() ?? null;
  if (opens != null && now < opens) {
    throw new HttpsError("failed-precondition", "Voting is not open yet.");
  }
  if (closes != null && now > closes) {
    throw new HttpsError("failed-precondition", "Voting has closed.");
  }
  return settings;
}

async function rebuildLiveStats(): Promise<void> {
  const attSnap = await db
    .collection(ATTENDANCE_COLLECTION)
    .where("attendanceVerified", "==", true)
    .get();

  const projectsSnap = await db
    .collection(PROJECTS_COLLECTION)
    .where("status", "in", ["submitted", "finalist"])
    .get();

  const eligible = projectsSnap.docs.filter((d) => {
    const h = d.data().hackathonId as string | undefined;
    return !h || h === ACTIVE_HACKATHON_ID;
  });

  const ranked = eligible
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        projectTitle: (data.projectTitle as string) || (data.teamName as string) || "Untitled",
        teamName: data.teamName as string | undefined,
        voteTotal: Number(data.voteTotal) || 0,
        place: (data.place as string) || null,
      };
    })
    .sort((a, b) => b.voteTotal - a.voteTotal);

  const totalVotesCast = ranked.reduce((sum, p) => sum + p.voteTotal, 0);
  const topProjects = ranked.slice(0, 10);

  await db
    .collection(LIVE_STATS_COLLECTION)
    .doc(LIVE_STATS_DOC)
    .set(
      {
        hackathonId: ACTIVE_HACKATHON_ID,
        checkInCount: attSnap.size,
        totalVotesCast,
        topProjects,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
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
    hackathonId: ACTIVE_HACKATHON_ID,
    createdAt: now,
    createdBy: uid,
    createdDate: now,
    updatedAt: now,
    updatedBy: uid,
    updatedDate: now,
    place: null,
    likes: 0,
    views: 0,
    voteTotal: 0,
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

// ── 8. castVotes ─────────────────────────────────────────

export const castVotes = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { allocations } = request.data as { allocations?: Record<string, number> };
  if (!allocations || typeof allocations !== "object") {
    throw new HttpsError("invalid-argument", "allocations object is required.");
  }

  await assertVotingOpen();

  const attSnap = await db.collection(ATTENDANCE_COLLECTION).doc(uid).get();
  if (!attSnap.exists || !attSnap.data()?.attendanceVerified) {
    throw new HttpsError("failed-precondition", "Check in before voting.");
  }

  const userSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
  const role = userSnap.data()?.role as string | undefined;
  const budget = voteBudgetForRole(role);
  const displayName =
    userSnap.data()?.displayName || request.auth?.token.name || request.auth?.token.email || "";

  const newAlloc: Record<string, number> = {};
  let total = 0;
  for (const [projectId, raw] of Object.entries(allocations)) {
    const count = Number(raw);
    if (!projectId || !Number.isInteger(count) || count < 0 || count > VOTE_MAX_PER_PROJECT) {
      throw new HttpsError(
        "invalid-argument",
        `Each project may receive 0–${VOTE_MAX_PER_PROJECT} votes.`
      );
    }
    if (count === 0) continue;
    const projSnap = await db.collection(PROJECTS_COLLECTION).doc(projectId).get();
    if (!projSnap.exists) {
      throw new HttpsError("not-found", `Project ${projectId} not found.`);
    }
    const pdata = projSnap.data()!;
    if (pdata.userId === uid) {
      throw new HttpsError("invalid-argument", "You cannot vote for your own project.");
    }
    if (pdata.status !== "submitted" && pdata.status !== "finalist") {
      throw new HttpsError("failed-precondition", "Only submitted projects are open for voting.");
    }
    const hId = (pdata.hackathonId as string) || ACTIVE_HACKATHON_ID;
    if (hId !== ACTIVE_HACKATHON_ID) {
      throw new HttpsError("failed-precondition", "Project is not part of the active hackathon.");
    }
    newAlloc[projectId] = count;
    total += count;
  }

  if (total === 0) {
    throw new HttpsError("invalid-argument", "Cast at least one vote.");
  }
  if (total > budget) {
    throw new HttpsError(
      "resource-exhausted",
      `Vote budget exceeded (${total}/${budget}). Organisers get ${VOTE_BUDGET_ORGANISER}; participants get ${VOTE_BUDGET_PARTICIPANT}.`
    );
  }

  const existingSnap = await db
    .collection(VOTES_COLLECTION)
    .where("userId", "==", uid)
    .where("hackathonId", "==", ACTIVE_HACKATHON_ID)
    .get();

  const oldAlloc: Record<string, number> = {};
  existingSnap.docs.forEach((d) => {
    const pid = d.data().projectId as string;
    const c = Number(d.data().voteCount) || 0;
    if (pid && c > 0) oldAlloc[pid] = c;
  });

  const projectIds = new Set([...Object.keys(oldAlloc), ...Object.keys(newAlloc)]);

  await db.runTransaction(async (tx) => {
    for (const projectId of projectIds) {
      const oldCount = oldAlloc[projectId] || 0;
      const newCount = newAlloc[projectId] || 0;
      const delta = newCount - oldCount;
      if (delta === 0) continue;

      const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
      const projectSnap = await tx.get(projectRef);
      if (!projectSnap.exists) {
        throw new HttpsError("not-found", `Project ${projectId} not found.`);
      }
      const currentTotal = Number(projectSnap.data()?.voteTotal) || 0;
      tx.update(projectRef, {
        voteTotal: Math.max(0, currentTotal + delta),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    for (const d of existingSnap.docs) {
      tx.delete(d.ref);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    for (const [projectId, voteCount] of Object.entries(newAlloc)) {
      const ref = db.collection(VOTES_COLLECTION).doc(voteDocId(ACTIVE_HACKATHON_ID, uid, projectId));
      tx.set(ref, {
        userId: uid,
        projectId,
        hackathonId: ACTIVE_HACKATHON_ID,
        voteCount,
        userName: displayName,
        attendanceVerified: true,
        timestamp: now,
        updatedAt: now,
      });
    }
  });

  try {
    await rebuildLiveStats();
  } catch (e) {
    console.error("rebuildLiveStats after castVotes failed", e);
  }

  return { success: true, totalVotes: total, budget };
});

// ── 9. refreshLiveStats ──────────────────────────────────

export const refreshLiveStats = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertAdmin(uid);
  await rebuildLiveStats();
  return { success: true };
});

// ── 10. assignWinnersFromVotes ───────────────────────────

export const assignWinnersFromVotes = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertAdmin(uid);

  const configSnap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
  if (configSnap.exists && configSnap.data()?.winnersAnnounced) {
    throw new HttpsError("failed-precondition", "Winners already announced.");
  }

  const projectsSnap = await db
    .collection(PROJECTS_COLLECTION)
    .where("status", "in", ["submitted", "finalist"])
    .get();

  const eligible = projectsSnap.docs.filter((d) => {
    const h = d.data().hackathonId as string | undefined;
    return !h || h === ACTIVE_HACKATHON_ID;
  });

  const ranked = eligible
    .map((d) => ({
      id: d.id,
      voteTotal: Number(d.data().voteTotal) || 0,
      createdAt: d.data().createdAt?.toMillis?.() ?? 0,
    }))
    .sort((a, b) => b.voteTotal - a.voteTotal || a.createdAt - b.createdAt);

  if (ranked.length < 3) {
    throw new HttpsError("failed-precondition", "Need at least three submitted projects to assign places.");
  }

  const places: Record<string, string> = {
    first: ranked[0].id,
    second: ranked[1].id,
    third: ranked[2].id,
  };

  const batch = db.batch();
  eligible.forEach((d) => {
    batch.update(d.ref, { place: null });
  });
  batch.update(db.collection(PROJECTS_COLLECTION).doc(places.first), { place: "first" });
  batch.update(db.collection(PROJECTS_COLLECTION).doc(places.second), { place: "second" });
  batch.update(db.collection(PROJECTS_COLLECTION).doc(places.third), { place: "third" });
  await batch.commit();

  try {
    await rebuildLiveStats();
  } catch (e) {
    console.error("rebuildLiveStats after assignWinners failed", e);
  }

  return { success: true, places };
});
