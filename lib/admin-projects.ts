import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

function callableErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "You do not have permission to delete archive projects.";
    }
    if (error.code === "functions/internal" || error.code === "functions/not-found") {
      return "Delete is not available yet. Deploy Firestore rules (archive admin delete) or the deleteArchivedProject function.";
    }
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Something went wrong. Please try again.";
}

/** Admin-only: remove project and its join requests (Cloud Function / Admin SDK). */
export async function deleteProjectAsAdmin(projectId: string): Promise<void> {
  const fn = httpsCallable<{ projectId: string }, { success: boolean }>(functions, "deleteProject");
  await fn({ projectId });
}

/** Admin-only: set or clear winner place on a project. */
export async function setProjectWinnerPlace(
  projectId: string,
  place: "first" | "second" | "third" | null
): Promise<void> {
  const fn = httpsCallable<
    { projectId: string; place: string | null },
    { success: boolean }
  >(functions, "setWinnerPlace");
  await fn({ projectId, place });
}

export { callableErrorMessage };
