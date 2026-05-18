/**
 * Hackathon timeline (London, May 2026).
 * Built with Date.UTC for reliable parsing on iOS Safari (avoids `+01:00` ISO quirks).
 */

/** 17 May 2026 00:00 London (BST, UTC+1) */
export const HACKATHON_IDEA_SUBMISSION_OPENS = new Date(Date.UTC(2026, 4, 16, 23, 0, 0));

/** 19 May 2026 20:00 London */
export const HACKATHON_SUBMISSION_DEADLINE = new Date(Date.UTC(2026, 4, 19, 19, 0, 0));

/** 18 May 2026 00:00 London — in-person build window */
export const HACKATHON_EVENT_START_DATE = new Date(Date.UTC(2026, 4, 17, 23, 0, 0));

/** 19 May 2026 18:00 London */
export const HACKATHON_EVENT_END_DATE = new Date(Date.UTC(2026, 4, 19, 17, 0, 0));

/** @deprecated Use HACKATHON_IDEA_SUBMISSION_OPENS */
export const HACKATHON_START_DATE = HACKATHON_IDEA_SUBMISSION_OPENS;
