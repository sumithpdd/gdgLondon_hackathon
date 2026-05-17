import type { User } from "firebase/auth";
import { getBearerAuthHeaders } from "@/lib/api/authHeaders";
import type { ErrorLogsResponse } from "@/types/error-log";

export async function fetchErrorLogsFromServer(
  options: {
    from?: string;
    to?: string;
    q?: string;
    limit?: number;
  },
  user?: User | null
): Promise<ErrorLogsResponse> {
  const p = new URLSearchParams();
  if (options.from) p.set("from", options.from);
  if (options.to) p.set("to", options.to);
  if (options.q) p.set("q", options.q);
  if (options.limit) p.set("limit", String(options.limit));
  const res = await fetch(`/api/admin/error-logs?${p.toString()}`, {
    headers: await getBearerAuthHeaders(user),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(String(json?.error ?? res.status));
  }
  return json.data as ErrorLogsResponse;
}

export async function postTestErrorLogEntry(user?: User | null): Promise<string> {
  const res = await fetch("/api/admin/error-logs/test", {
    method: "POST",
    headers: await getBearerAuthHeaders(user),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(String(json?.error ?? res.status));
  }
  return String((json.data as { id?: string })?.id ?? "");
}

export type AdminHealthResult = {
  env: {
    ok: boolean;
    projectId?: string;
    hasEmail: boolean;
    keyLength: number;
    keyLooksValid: boolean;
    error?: string;
  };
  clientProject?: string;
  projectsMatch: boolean;
  tokenVerified: boolean;
  tokenError?: string;
  uid?: string;
  role?: string;
};

export async function fetchAdminHealth(user?: User | null): Promise<AdminHealthResult> {
  const res = await fetch("/api/admin/health", {
    headers: await getBearerAuthHeaders(user),
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.ok) {
    throw new Error(String(json?.error ?? res.status));
  }
  return json.data as AdminHealthResult;
}
