/** Set before signInWithRedirect; cleared after post-login navigation (iOS-safe vs sessionStorage). */
export const GOOGLE_REDIRECT_PENDING_KEY = "hackathon_google_redirect_pending";

export const HACKATHON_AUTH_REDIRECT_KEY = "hackathon_auth_redirect";

export function savePostLoginRedirect(path: string): void {
  if (typeof window === "undefined" || !path.startsWith("/")) return;
  try {
    window.localStorage.setItem(HACKATHON_AUTH_REDIRECT_KEY, path);
    window.sessionStorage.setItem(HACKATHON_AUTH_REDIRECT_KEY, path);
  } catch {
    /* private mode */
  }
}

export function readPostLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(HACKATHON_AUTH_REDIRECT_KEY) ||
      window.sessionStorage.getItem(HACKATHON_AUTH_REDIRECT_KEY)
    );
  } catch {
    return null;
  }
}

export function clearPostLoginRedirect(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HACKATHON_AUTH_REDIRECT_KEY);
    window.sessionStorage.removeItem(HACKATHON_AUTH_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}

export function markGoogleRedirectPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeGoogleRedirectPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY);
    if (v === "1") {
      window.localStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
