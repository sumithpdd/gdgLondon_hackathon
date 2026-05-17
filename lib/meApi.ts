/**
 * Authenticated calls to /api/me/* (Firebase ID token).
 */

import type { User } from "firebase/auth";
import { getBearerAuthHeaders } from "@/lib/api/authHeaders";

export type EventCheckInStatusResult = {
  eligible: boolean;
  active: boolean;
  checkedIn: boolean;
  selfCheckInEnabled: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

async function authFetch(path: string, init?: RequestInit, user?: User | null): Promise<Response> {
  const headers = await getBearerAuthHeaders(user);
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> | undefined),
      ...headers,
    },
  });
}

export async function fetchEventCheckInStatus(): Promise<EventCheckInStatusResult | null> {
  const res = await authFetch("/api/me/attendance/check-in-status");
  const json = await res.json();
  if (!json.ok) return null;
  return json.data as EventCheckInStatusResult;
}

export async function postEventSelfCheckIn(code: string): Promise<{ alreadyMarked?: boolean }> {
  const res = await authFetch("/api/me/attendance/self-check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Check-in failed");
  return (json.data ?? {}) as { alreadyMarked?: boolean };
}
