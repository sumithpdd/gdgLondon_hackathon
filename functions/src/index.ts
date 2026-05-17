import * as admin from "firebase-admin";
import { createHash, randomInt } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const PROJECTS_COLLECTION = process.env.PROJECTS_COLLECTION || "hackatonProjects";
const USERS_COLLECTION = process.env.USERS_COLLECTION || "hackatonUsers";
const JOIN_REQUESTS_COLLECTION = process.env.JOIN_REQUESTS_COLLECTION || "hackatonJoinRequests";
const CONFIG_COLLECTION = process.env.CONFIG_COLLECTION || "hackatonConfig";
const CONFIG_DOC = process.env.CONFIG_DOC || "settings";
const VOTES_COLLECTION = process.env.VOTES_COLLECTION || "io2026Hackathon_votes";
const ATTENDANCE_COLLECTION = process.env.ATTENDANCE_COLLECTION || "io2026Hackathon_attendance";
const ACTIVE_HACKATHON_ID = process.env.ACTIVE_HACKATHON_ID || "io2026Hackathon";
const ACTIVE_HACKATHON_NAME = process.env.ACTIVE_HACKATHON_NAME || "GDG London Hackathon";
const LIVE_STATS_COLLECTION = process.env.LIVE_STATS_COLLECTION || "io2026Hackathon_liveStats";
const LIVE_STATS_DOC = "summary";
const CHECKIN_PUBLIC_DOC = "checkInPublic";
const CHECKIN_SECRETS_DOC = "checkInSecrets";

const VOTE_BUDGET_ORGANISER = 10;
const VOTE_BUDGET_PARTICIPANT = 5;
const VOTE_MAX_PER_PROJECT = 2;

admin.initializeApp();
const db = admin.firestore();

// ── helpers ──────────────────────────────────────────────

async function getActorRole(uid: string): Promise<string | undefined> {
  const collections = [...new Set([USERS_COLLECTION, "io2026Hackathon_users", "hackatonUsers"])];
  for (const col of collections) {
    const snap = await db.collection(col).doc(uid).get();
    if (snap.exists) return snap.data()?.role as string | undefined;
  }
  return undefined;
}

async function assertAdmin(uid: string): Promise<void> {
  const role = await getActorRole(uid);
  if (role === "admin") return;
  throw new HttpsError("permission-denied", "Admin access required.");
}

async function assertOrganiser(uid: string): Promise<void> {
  const role = await getActorRole(uid);
  if (role === "admin" || role === "moderator") return;
  throw new HttpsError("permission-denied", "Organiser access required.");
}

function hashCheckInCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function normalizeCheckInCode(raw: string): string {
  return String(raw || "").replace(/\s/g, "").trim();
}

function randomSixDigitCode(): string {
  return String(randomInt(100000, 1000000));
}

async function fetchCheckInPublic(): Promise<Record<string, unknown>> {
  const snap = await db.collection(CONFIG_COLLECTION).doc(CHECKIN_PUBLIC_DOC).get();
  return snap.exists ? snap.data() || {} : {};
}

function assertSelfCheckInWindow(publicCfg: Record<string, unknown>): void {
  if (publicCfg.selfCheckInEnabled !== true) {
    throw new HttpsError("failed-precondition", "Self check-in is not enabled.");
  }
  const now = Date.now();
  const opens = (publicCfg.windowOpensAt as admin.firestore.Timestamp | undefined)?.toMillis?.();
  const closes = (publicCfg.windowClosesAt as admin.firestore.Timestamp | undefined)?.toMillis?.();
  if (opens != null && now < opens) {
    throw new HttpsError("failed-precondition", "Check-in is not open yet.");
  }
  if (closes != null && now > closes) {
    throw new HttpsError("failed-precondition", "Check-in has closed.");
  }
}

async function writeAttendance(params: {
  targetUid: string;
  actorUid: string;
  method: "self" | "staff";
  cohort?: string | null;
}): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload: Record<string, unknown> = {
    userId: params.targetUid,
    checkedInAt: now,
    checkedInByUid: params.actorUid,
    method: params.method,
    attendanceVerified: true,
  };
  if (params.method === "staff" && params.cohort) {
    payload.cohort = params.cohort;
  }
  await db.collection(ATTENDANCE_COLLECTION).doc(params.targetUid).set(payload, { merge: true });
  try {
    await rebuildLiveStats();
  } catch {
    /* non-fatal */
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
    .where("hackathonId", "==", ACTIVE_HACKATHON_ID)
    .limit(1)
    .get();
  if (!ownerSnap.empty) {
    return { projectId: ownerSnap.docs[0].id, role: "owner" };
  }

  const memberSnap = await db
    .collection(JOIN_REQUESTS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "approved")
    .get();
  for (const memberDoc of memberSnap.docs) {
    const projectId = memberDoc.data().projectId as string;
    if (!projectId) continue;
    const projectSnap = await db.collection(PROJECTS_COLLECTION).doc(projectId).get();
    const h = projectSnap.data()?.hackathonId as string | undefined;
    if (projectSnap.exists && (!h || h === ACTIVE_HACKATHON_ID)) {
      return { projectId, role: "member" };
    }
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
    hackathonName: ACTIVE_HACKATHON_NAME,
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

// ── 3b. ensureUserProfile ─────────────────────────────────
// Upserts io2026Hackathon_users/{uid} on every sign-in (copies hackatonUsers if needed).

const IO_USERS_COLLECTION = "io2026Hackathon_users";
const LEGACY_USERS_COLLECTION = "hackatonUsers";

const PROFILE_COPY_KEYS = [
  "hackathonBio",
  "hackathonLinkedinUrl",
  "skills",
  "interests",
  "expertise",
  "techStack",
  "twitterUrl",
  "facebookUrl",
  "instagramUrl",
  "teamPreference",
  "inPersonAttendance",
  "profileCompletionPercent",
  "profileDisplayName",
  "city",
  "country",
  "experienceLevel",
  "programmingSkills",
  "domainExpertise",
  "wantToLearnTags",
  "canOfferTags",
  "githubUrl",
  "websiteUrl",
  "buddiesVisibleInDirectory",
] as const;

export const ensureUserProfile = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const email = (request.auth?.token.email as string) || "";
  const displayName = (request.auth?.token.name as string) || email.split("@")[0] || "User";
  const hackathonId = ACTIVE_HACKATHON_ID;

  const ioRef = db.collection(IO_USERS_COLLECTION).doc(uid);
  const ioSnap = await ioRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  let seed: Record<string, unknown> = ioSnap.exists ? ioSnap.data() || {} : {};
  if (!ioSnap.exists) {
    const legacySnap = await db.collection(LEGACY_USERS_COLLECTION).doc(uid).get();
    if (legacySnap.exists) {
      seed = { ...legacySnap.data(), ...seed };
    }
  }

  const participations: Record<string, unknown> = {
    ...(typeof seed.hackathonParticipations === "object" && seed.hackathonParticipations
      ? (seed.hackathonParticipations as Record<string, unknown>)
      : {}),
  };
  if (!participations[hackathonId]) {
    participations[hackathonId] = { joinedAt: now };
  }

  const payload: Record<string, unknown> = {
    uid,
    email: email || seed.email || null,
    displayName: displayName || seed.displayName || "User",
    role: seed.role || "user",
    hackathonParticipations: participations,
    profileStatus: "active",
    updatedAt: now,
    updatedBy: uid,
    updatedDate: now,
  };

  for (const key of PROFILE_COPY_KEYS) {
    if (seed[key] !== undefined) payload[key] = seed[key];
  }

  if (!ioSnap.exists) {
    payload.createdAt = seed.createdAt || now;
    payload.createdBy = seed.createdBy || uid;
    payload.createdDate = seed.createdDate || now;
    const legacySnap = await db.collection(LEGACY_USERS_COLLECTION).doc(uid).get();
    if (legacySnap.exists) {
      payload.migratedFromLegacyAt = now;
      payload.migratedFrom = LEGACY_USERS_COLLECTION;
    }
  }

  await ioRef.set(payload, { merge: true });
  return { ok: true, collection: IO_USERS_COLLECTION };
});

// ── 3c. adminProvisionHackathonUser ───────────────────────
// Admin: add Firebase Auth user (by email) to io2026Hackathon_users for the active hackathon.

async function resolveUidForEmail(normalizedEmail: string): Promise<{
  uid: string;
  source: string;
  seed?: Record<string, unknown>;
}> {
  try {
    const authUser = await admin.auth().getUserByEmail(normalizedEmail);
    const uid = authUser.uid;
    const legacySnap = await db.collection(LEGACY_USERS_COLLECTION).doc(uid).get();
    const authSeed: Record<string, unknown> = {
      email: authUser.email || normalizedEmail,
      displayName: authUser.displayName || undefined,
    };
    return {
      uid,
      source: "firebase-auth",
      seed: legacySnap.exists
        ? { ...legacySnap.data(), ...authSeed }
        : authSeed,
    };
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code !== "auth/user-not-found") throw e;
  }

  for (const col of [IO_USERS_COLLECTION, LEGACY_USERS_COLLECTION] as const) {
    const snap = await db.collection(col).where("email", "==", normalizedEmail).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { uid: doc.id, source: `firestore:${col}`, seed: doc.data() };
    }
  }

  throw new HttpsError(
    "not-found",
    "No account with this email. Ask them to register or sign in once, then try again."
  );
}

export const adminLookupUserByEmail = onCall(async (request) => {
  const adminUid = request.auth?.uid;
  if (!adminUid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertAdmin(adminUid);

  const { email } = request.data as { email?: string };
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }

  let userId: string | undefined;
  let displayName: string | null | undefined;
  let foundInAuth = false;

  try {
    const authUser = await admin.auth().getUserByEmail(normalizedEmail);
    foundInAuth = true;
    userId = authUser.uid;
    displayName = authUser.displayName ?? null;
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code !== "auth/user-not-found") throw e;
  }

  if (!userId) {
    for (const col of [IO_USERS_COLLECTION, LEGACY_USERS_COLLECTION] as const) {
      const snap = await db.collection(col).where("email", "==", normalizedEmail).limit(1).get();
      if (!snap.empty) {
        userId = snap.docs[0].id;
        const data = snap.docs[0].data();
        displayName = (data.displayName as string) ?? null;
        break;
      }
    }
  }

  let inActiveUsers = false;
  let inLegacyUsers = false;
  if (userId) {
    const [activeSnap, legacySnap] = await Promise.all([
      db.collection(IO_USERS_COLLECTION).doc(userId).get(),
      db.collection(LEGACY_USERS_COLLECTION).doc(userId).get(),
    ]);
    inActiveUsers = activeSnap.exists;
    inLegacyUsers = legacySnap.exists;
    if (!displayName) {
      displayName =
        (activeSnap.data()?.displayName as string) ||
        (legacySnap.data()?.displayName as string) ||
        null;
    }
  }

  return {
    email: normalizedEmail,
    foundInAuth,
    userId,
    inActiveUsers,
    inLegacyUsers,
    displayName: displayName ?? null,
    canProvision: foundInAuth,
  };
});

export const adminProvisionHackathonUser = onCall(async (request) => {
  const adminUid = request.auth?.uid;
  if (!adminUid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertAdmin(adminUid);

  const { email, displayName, role } = request.data as {
    email?: string;
    displayName?: string;
    role?: string;
  };

  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }

  const resolvedRole =
    role && ["admin", "moderator", "user"].includes(role) ? role : "user";

  const { uid, source, seed = {} } = await resolveUidForEmail(normalizedEmail);
  const hackathonId = ACTIVE_HACKATHON_ID;
  const ioRef = db.collection(IO_USERS_COLLECTION).doc(uid);
  const ioSnap = await ioRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const created = !ioSnap.exists;

  const participations: Record<string, unknown> = {
    ...(typeof seed.hackathonParticipations === "object" && seed.hackathonParticipations
      ? (seed.hackathonParticipations as Record<string, unknown>)
      : {}),
  };
  if (!participations[hackathonId]) {
    participations[hackathonId] = { joinedAt: now };
  }

  const payload: Record<string, unknown> = {
    uid,
    email: normalizedEmail,
    displayName:
      (displayName || "").trim() ||
      (seed.displayName as string) ||
      normalizedEmail.split("@")[0] ||
      "User",
    role: created ? resolvedRole : (ioSnap.data()?.role as string) || resolvedRole,
    hackathonParticipations: participations,
    adminProvisioned: true,
    profileStatus: "provisioned",
    provisionedBy: adminUid,
    provisionedAt: now,
    updatedAt: now,
    updatedBy: adminUid,
    updatedDate: now,
  };

  for (const key of PROFILE_COPY_KEYS) {
    if (seed[key] !== undefined) payload[key] = seed[key];
  }

  if (created) {
    payload.createdAt = seed.createdAt || now;
    payload.createdBy = adminUid;
    payload.createdDate = now;
    if (source === "firestore:hackatonUsers") {
      payload.migratedFromLegacyAt = now;
      payload.migratedFrom = LEGACY_USERS_COLLECTION;
    }
  }

  await ioRef.set(payload, { merge: true });

  return {
    success: true,
    userId: uid,
    created,
    email: normalizedEmail,
  };
});

// ── 3d. Check-in code & attendance (organiser desk) ───────

export const updateCheckInConfig = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertOrganiser(uid);

  const { selfCheckInEnabled, windowOpensAt, windowClosesAt } = request.data as {
    selfCheckInEnabled?: boolean;
    windowOpensAt?: string | null;
    windowClosesAt?: string | null;
  };

  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload: Record<string, unknown> = {
    selfCheckInEnabled: selfCheckInEnabled === true,
    updatedAt: now,
    updatedBy: uid,
  };

  if (windowOpensAt === null) {
    payload.windowOpensAt = admin.firestore.FieldValue.delete();
  } else if (windowOpensAt) {
    payload.windowOpensAt = admin.firestore.Timestamp.fromDate(new Date(windowOpensAt));
  }
  if (windowClosesAt === null) {
    payload.windowClosesAt = admin.firestore.FieldValue.delete();
  } else if (windowClosesAt) {
    payload.windowClosesAt = admin.firestore.Timestamp.fromDate(new Date(windowClosesAt));
  }

  await db.collection(CONFIG_COLLECTION).doc(CHECKIN_PUBLIC_DOC).set(payload, { merge: true });
  return { success: true };
});

export const generateCheckInCode = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertOrganiser(uid);

  const code = randomSixDigitCode();
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db
    .collection(CONFIG_COLLECTION)
    .doc(CHECKIN_SECRETS_DOC)
    .set(
      {
        codeHash: hashCheckInCode(code),
        generatedAt: now,
        generatedBy: uid,
      },
      { merge: true }
    );

  return { code };
});

export const selfCheckInWithCode = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const { code } = request.data as { code?: string };
  const normalized = normalizeCheckInCode(code || "");
  if (!/^\d{6}$/.test(normalized)) {
    throw new HttpsError("invalid-argument", "Enter the 6-digit check-in code.");
  }

  const publicCfg = await fetchCheckInPublic();
  assertSelfCheckInWindow(publicCfg);

  const secretsSnap = await db.collection(CONFIG_COLLECTION).doc(CHECKIN_SECRETS_DOC).get();
  const storedHash = secretsSnap.data()?.codeHash as string | undefined;
  if (!storedHash || storedHash !== hashCheckInCode(normalized)) {
    throw new HttpsError("permission-denied", "Incorrect check-in code.");
  }

  await writeAttendance({ targetUid: uid, actorUid: uid, method: "self" });
  return { success: true };
});

export const staffCheckInUser = onCall(async (request) => {
  const actorUid = request.auth?.uid;
  if (!actorUid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertOrganiser(actorUid);

  const { targetUserId, email, cohort } = request.data as {
    targetUserId?: string;
    email?: string;
    cohort?: string | null;
  };

  let uid = (targetUserId || "").trim();
  if (!uid && email) {
    const resolved = await resolveUidForEmail(email.trim().toLowerCase());
    uid = resolved.uid;
  }
  if (!uid) {
    throw new HttpsError("invalid-argument", "targetUserId or email is required.");
  }

  if (cohort != null && cohort !== "" && cohort !== "aidevcamp_flat") {
    throw new HttpsError("invalid-argument", "Invalid cohort.");
  }
  const cohortValue = cohort === "aidevcamp_flat" ? "aidevcamp_flat" : null;

  await writeAttendance({
    targetUid: uid,
    actorUid,
    method: "staff",
    cohort: cohortValue,
  });
  return { success: true, userId: uid };
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

// ── 5b. setUserRole ──────────────────────────────────────

export const setUserRole = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  const { targetUserId, role } = request.data as { targetUserId?: string; role?: string };
  if (!targetUserId) throw new HttpsError("invalid-argument", "targetUserId is required.");
  if (!role || !["admin", "moderator", "user"].includes(role)) {
    throw new HttpsError("invalid-argument", "role must be admin, moderator, or user.");
  }

  const collections = [...new Set([USERS_COLLECTION, "io2026Hackathon_users", "hackatonUsers"])];
  const now = admin.firestore.FieldValue.serverTimestamp();
  let updated = false;

  for (const col of collections) {
    const ref = db.collection(col).doc(targetUserId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        role,
        updatedAt: now,
        updatedBy: uid,
        updatedDate: now,
      });
      updated = true;
    }
  }

  if (!updated) {
    throw new HttpsError("not-found", "User profile not found.");
  }

  return { success: true };
});

// ── 5c. adminUpdateUser ──────────────────────────────────

const ADMIN_USER_PATCH_KEYS = [
  "displayName",
  "profileDisplayName",
  "email",
  "hackathonBio",
  "city",
  "country",
  "experienceLevel",
  "programmingSkills",
  "domainExpertise",
  "interests",
  "expertise",
  "techStack",
  "wantToLearnTags",
  "canOfferTags",
  "skills",
  "hackathonLinkedinUrl",
  "githubUrl",
  "websiteUrl",
  "twitterUrl",
  "facebookUrl",
  "instagramUrl",
  "teamPreference",
  "inPersonAttendance",
  "buddiesVisibleInDirectory",
  "profileCompletionPercent",
] as const;

export const adminUpdateUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  const { targetUserId, patch } = request.data as {
    targetUserId?: string;
    patch?: Record<string, unknown>;
  };
  if (!targetUserId) throw new HttpsError("invalid-argument", "targetUserId is required.");
  if (!patch || typeof patch !== "object") {
    throw new HttpsError("invalid-argument", "patch object is required.");
  }

  const data: Record<string, unknown> = {};
  for (const key of ADMIN_USER_PATCH_KEYS) {
    if (key in patch) data[key] = patch[key];
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  data.updatedAt = now;
  data.updatedBy = uid;
  data.updatedDate = now;

  const collections = [...new Set([USERS_COLLECTION, "io2026Hackathon_users", "hackatonUsers"])];
  let updated = false;

  for (const col of collections) {
    const ref = db.collection(col).doc(targetUserId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update(data);
      updated = true;
    }
  }

  if (!updated) {
    throw new HttpsError("not-found", "User profile not found.");
  }

  return { success: true };
});

// ── 5d. adminSetUserDeleted ──────────────────────────────

export const adminSetUserDeleted = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await assertAdmin(uid);

  const { targetUserId, restore } = request.data as {
    targetUserId?: string;
    restore?: boolean;
  };
  if (!targetUserId) throw new HttpsError("invalid-argument", "targetUserId is required.");
  if (targetUserId === uid && !restore) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account.");
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload = restore
    ? {
        deletedAt: admin.firestore.FieldValue.delete(),
        deletedBy: admin.firestore.FieldValue.delete(),
        updatedAt: now,
        updatedBy: uid,
        updatedDate: now,
      }
    : {
        deletedAt: now,
        deletedBy: uid,
        buddiesVisibleInDirectory: false,
        updatedAt: now,
        updatedBy: uid,
        updatedDate: now,
      };

  const collections = [...new Set([USERS_COLLECTION, "io2026Hackathon_users", "hackatonUsers"])];
  let updated = false;
  for (const col of collections) {
    const ref = db.collection(col).doc(targetUserId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update(payload);
      updated = true;
    }
  }

  if (!updated) throw new HttpsError("not-found", "User profile not found.");
  return { success: true };
});

// ── 5b. deleteArchivedProject ────────────────────────────

const IWD_ARCHIVE_PROJECTS = "iwd2026Hackathon_projects";
const IWD_ARCHIVE_WINNERS = "iwd2026Hackathon_winners";

export const deleteArchivedProject = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await assertAdmin(uid);

  const { projectId } = request.data as { projectId?: string };
  if (!projectId) throw new HttpsError("invalid-argument", "projectId is required.");

  const projectRef = db.collection(IWD_ARCHIVE_PROJECTS).doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    throw new HttpsError("not-found", "Archived project not found.");
  }

  const commentsSnap = await projectRef.collection("comments").get();
  const winnerSnap = await db
    .collection(IWD_ARCHIVE_WINNERS)
    .where("projectId", "==", projectId)
    .get();

  const batch = db.batch();
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  winnerSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(projectRef);
  await batch.commit();

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

  const joinRequests = await db
    .collection(JOIN_REQUESTS_COLLECTION)
    .where("projectId", "==", projectId)
    .get();

  const commentsSnap = await projectRef.collection("comments").get();

  const batch = db.batch();
  joinRequests.docs.forEach((d) => batch.delete(d.ref));
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
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
