import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { CHECKIN_PUBLIC_DOC_ID, SETTINGS_COLLECTION } from "./constants";
import type { AttendanceCohort } from "./attendance";

export type CheckInPublicConfig = {
  selfCheckInEnabled: boolean;
  windowOpensAt?: Date;
  windowClosesAt?: Date;
  updatedAt?: Date;
};

export type CheckInWindowStatus = "open" | "not_yet" | "closed" | "disabled";

function parseDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate();
  }
  return undefined;
}

export async function fetchCheckInPublicConfig(): Promise<CheckInPublicConfig> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, CHECKIN_PUBLIC_DOC_ID));
  if (!snap.exists()) {
    return { selfCheckInEnabled: false };
  }
  const data = snap.data();
  return {
    selfCheckInEnabled: data.selfCheckInEnabled === true,
    windowOpensAt: parseDate(data.windowOpensAt),
    windowClosesAt: parseDate(data.windowClosesAt),
    updatedAt: parseDate(data.updatedAt),
  };
}

export function getCheckInWindowStatus(
  config: CheckInPublicConfig,
  now: Date = new Date()
): CheckInWindowStatus {
  if (!config.selfCheckInEnabled) return "disabled";
  const t = now.getTime();
  const opens = config.windowOpensAt?.getTime();
  const closes = config.windowClosesAt?.getTime();
  if (opens != null && t < opens) return "not_yet";
  if (closes != null && t > closes) return "closed";
  return "open";
}

export function formatCheckInWindow(config: CheckInPublicConfig): string {
  const fmt = (d?: Date) =>
    d
      ? d.toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  if (!config.windowOpensAt && !config.windowClosesAt) return "No window set";
  return `${fmt(config.windowOpensAt)} – ${fmt(config.windowClosesAt)}`;
}

export function normalizeCheckInCodeInput(raw: string): string {
  return raw.replace(/\s/g, "").trim();
}

export function formatCheckInCodeDisplay(code: string): string {
  const digits = normalizeCheckInCodeInput(code);
  if (digits.length !== 6) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export async function updateCheckInPublicConfig(params: {
  selfCheckInEnabled: boolean;
  windowOpensAt: Date | null;
  windowClosesAt: Date | null;
}): Promise<void> {
  const fn = httpsCallable<
    {
      selfCheckInEnabled: boolean;
      windowOpensAt: string | null;
      windowClosesAt: string | null;
    },
    { success: boolean }
  >(functions, "updateCheckInConfig");
  await fn({
    selfCheckInEnabled: params.selfCheckInEnabled,
    windowOpensAt: params.windowOpensAt ? params.windowOpensAt.toISOString() : null,
    windowClosesAt: params.windowClosesAt ? params.windowClosesAt.toISOString() : null,
  });
}

export async function generateCheckInCode(): Promise<{ code: string }> {
  const fn = httpsCallable<Record<string, never>, { code: string }>(functions, "generateCheckInCode");
  const result = await fn({});
  return result.data;
}

const ORGANISER_CODE_SESSION_KEY = "hackathon_organiser_checkin_code";

export function persistOrganiserCheckInCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ORGANISER_CODE_SESSION_KEY, normalizeCheckInCodeInput(code));
  } catch {
    /* private mode */
  }
}

export function readOrganiserCheckInCodeSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ORGANISER_CODE_SESSION_KEY);
  } catch {
    return null;
  }
}

/** Active 6-digit code for the organiser desk (stored server-side on generate). */
export async function fetchCheckInDeskCode(): Promise<{ code: string | null; generatedAt?: Date }> {
  const fn = httpsCallable<Record<string, never>, { code: string | null; generatedAt?: string }>(
    functions,
    "getCheckInDeskCode"
  );
  const result = await fn({});
  return {
    code: result.data.code,
    generatedAt: result.data.generatedAt ? new Date(result.data.generatedAt) : undefined,
  };
}

export async function setAttendeeSwag(params: {
  targetUserId: string;
  swagReceived: boolean;
}): Promise<void> {
  const fn = httpsCallable<{ targetUserId: string; swagReceived: boolean }, { success: boolean }>(
    functions,
    "setAttendeeSwag"
  );
  await fn(params);
}

/** Prefer `postEventSelfCheckIn` from `lib/meApi` (API route). Callable fallback for legacy clients. */
export async function selfCheckInWithCode(code: string): Promise<void> {
  const fn = httpsCallable<{ code: string }, { success: boolean }>(functions, "selfCheckInWithCode");
  await fn({ code: normalizeCheckInCodeInput(code) });
}

export async function resetUserAttendance(targetUserId: string): Promise<void> {
  const fn = httpsCallable<{ targetUserId: string }, { success: boolean }>(
    functions,
    "resetUserAttendance"
  );
  await fn({ targetUserId: targetUserId.trim() });
}

export type StaffCheckInCohort = "aidevcamp2026" | null;

/** Tag or re-tag a checked-in attendee as AI DevCamp 2026 (staff desk). */
export async function tagAttendeeAidevcamp2026(targetUserId: string): Promise<void> {
  await staffCheckInUser({ targetUserId, cohort: "aidevcamp2026" });
}

export async function staffCheckInUser(params: {
  targetUserId?: string;
  email?: string;
  cohort?: StaffCheckInCohort;
}): Promise<{ userId: string }> {
  const fn = httpsCallable<
    { targetUserId?: string; email?: string; cohort?: string | null },
    { success: boolean; userId: string }
  >(functions, "staffCheckInUser");
  const result = await fn({
    targetUserId: params.targetUserId,
    email: params.email?.trim().toLowerCase(),
    cohort: params.cohort ?? null,
  });
  return { userId: result.data.userId };
}

export function callableCheckInError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Something went wrong. Please try again.";
}
