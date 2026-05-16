import {
  HACKATHON_IDEA_SUBMISSION_OPENS,
  HACKATHON_SUBMISSION_DEADLINE,
} from "./constants";

/** Before idea submission opens (17 May 2026 London). */
export function isBeforeIdeaSubmissionOpens(now: Date = new Date()): boolean {
  return now < HACKATHON_IDEA_SUBMISSION_OPENS;
}

/** After the final submission deadline (19 May 2026 8pm London). */
export function isAfterSubmissionDeadline(now: Date = new Date()): boolean {
  return now > HACKATHON_SUBMISSION_DEADLINE;
}

/** Inclusive window when participants may create/edit drafts and submit. */
export function isSubmissionWindowOpen(now: Date = new Date()): boolean {
  return !isBeforeIdeaSubmissionOpens(now) && !isAfterSubmissionDeadline(now);
}

/** Project form should be read-only (before opens or after deadline). */
export function isProjectFormLocked(now: Date = new Date()): boolean {
  return isBeforeIdeaSubmissionOpens(now) || isAfterSubmissionDeadline(now);
}
