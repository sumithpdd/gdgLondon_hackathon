import { auth } from "@/lib/firebase";
import type { ErrorLogsResponse } from "@/types/error-log";

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in required");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchErrorLogsFromServer(options: {
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
}): Promise<ErrorLogsResponse> {
  const p = new URLSearchParams();
  if (options.from) p.set("from", options.from);
  if (options.to) p.set("to", options.to);
  if (options.q) p.set("q", options.q);
  if (options.limit) p.set("limit", String(options.limit));
  const res = await fetch(`/api/admin/error-logs?${p.toString()}`, {
    headers: await authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(String(json?.error ?? res.status));
  }
  return json.data as ErrorLogsResponse;
}

export async function postTestErrorLogEntry(): Promise<string> {
  const res = await fetch("/api/admin/error-logs/test", {
    method: "POST",
    headers: await authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(String(json?.error ?? res.status));
  }
  return String((json.data as { id?: string })?.id ?? "");
}
