import { HACKATHON_SUBMISSION_DEADLINE } from "./constants";
import {
  isAfterSubmissionDeadline,
  isBeforeIdeaSubmissionOpens,
} from "./hackathon-timeline";

/** After final submission deadline (same as `isAfterSubmissionDeadline`). */
export function isAfterDeadline(): boolean {
  return isAfterSubmissionDeadline();
}

export function isBeforeDeadline(): boolean {
  return new Date() <= HACKATHON_SUBMISSION_DEADLINE;
}

export {
  isBeforeIdeaSubmissionOpens,
  isAfterSubmissionDeadline,
  isSubmissionWindowOpen,
  isProjectFormLocked,
} from "./hackathon-timeline";
