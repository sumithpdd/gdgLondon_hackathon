import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { firebaseAuthErrorMessage } from "@/lib/firebaseAuthErrors";

declare global {
  interface Window {
    __hackathonGoogleRedirectChecked?: boolean;
  }
}

/**
 * Call once on app load. Surfaces redirect errors; successful sign-in is handled by onAuthStateChanged.
 */
export async function handleGoogleRedirectResultOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.__hackathonGoogleRedirectChecked) return;
  window.__hackathonGoogleRedirectChecked = true;

  try {
    await getRedirectResult(auth);
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/redirect-cancelled-by-user"
    ) {
      return;
    }
    console.error("Google redirect sign-in failed:", err);
    throw new Error(firebaseAuthErrorMessage(err));
  }
}
