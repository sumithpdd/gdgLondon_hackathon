/**
 * Maps Firebase Auth errors to short, actionable copy.
 */
export function firebaseAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: string }).code)
      : "";

  switch (code) {
    case "auth/unauthorized-domain":
      return "This site’s domain is not allowed for sign-in. Add it under Firebase Console → Authentication → Authorized domains.";
    case "auth/operation-not-allowed":
      return "This sign-in method is turned off in Firebase. Enable it under Authentication → Sign-in method.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups for this site and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/invalid-email":
      return "That email address doesn’t look valid.";
    case "auth/missing-email":
      return "Enter the email you use for your account.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/argument-error":
      return "Sign-in couldn’t start — check your details or use Continue with Google.";
    default:
      if (code) return `Sign-in failed (${code}).`;
      return "Sign-in failed. Please try again.";
  }
}
