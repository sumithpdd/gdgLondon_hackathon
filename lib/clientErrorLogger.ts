import { auth } from "@/lib/firebase";

export type ClientErrorPayload = {
  message: string;
  name?: string;
  stack?: string;
  source: "window" | "unhandledrejection" | "react" | "report";
};

/** WebKit / Safari IndexedDB flakes — noisy on iOS; skip logging. */
function isNoisyIndexedDbRejectionMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("indexed database server lost") ||
    (m.includes("indexed database") && m.includes("refresh the page"))
  );
}

/** Send a client error to `POST /api/log-error` (Firestore via Admin SDK). Never throws. */
export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
  if (typeof window === "undefined") return;
  if (
    payload.source === "unhandledrejection" &&
    isNoisyIndexedDbRejectionMessage(payload.message)
  ) {
    return;
  }
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch("/api/log-error", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...payload,
        path: window.location?.pathname,
        url: window.location?.href,
      }),
    });
    if (!res.ok) {
      console.error("[reportClientError] failed", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[reportClientError] request failed", e);
  }
}

/** Use in try/catch when you want explicit reporting beyond global listeners. */
export function logClientError(
  error: unknown,
  source: ClientErrorPayload["source"] = "report"
): void {
  const { message, name, stack } = errorToParts(error);
  void reportClientError({
    source,
    message: message.slice(0, 1_500),
    name,
    stack: stack?.slice(0, 8_000),
  });
}

function errorToParts(error: unknown): { message: string; name: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message || "Error",
      name: error.name,
      stack: error.stack,
    };
  }
  return { message: String(error), name: "Error" };
}

export function installGlobalErrorListeners(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __hackathon_error_hooks?: boolean };
  if (w.__hackathon_error_hooks) return;
  w.__hackathon_error_hooks = true;

  window.addEventListener("error", (ev) => {
    const err = ev.error;
    void reportClientError({
      source: "window",
      message: String(err?.message || ev.message || "Unknown error").slice(0, 1_500),
      name: String(err?.name || "Error"),
      stack: typeof err?.stack === "string" ? err.stack.slice(0, 8_000) : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const r = ev.reason;
    const message =
      r instanceof Error
        ? r.message
        : typeof r === "string"
          ? r
          : (() => {
              try {
                return JSON.stringify(r);
              } catch {
                return "Unhandled promise rejection";
              }
            })();
    const stack = r instanceof Error && r.stack ? r.stack : undefined;
    void reportClientError({
      source: "unhandledrejection",
      message: String(message).slice(0, 1_500),
      name: r instanceof Error ? r.name : "UnhandledRejection",
      stack: stack ? stack.slice(0, 8_000) : undefined,
    });
  });
}
