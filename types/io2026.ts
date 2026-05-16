/**
 * Firestore shapes for io2026Hackathon_* (live) and iwd2026Hackathon_* (archive).
 * Align implementation with docs/IO2026_HACKATHON_SPEC.md (event name vs Buddies feature in lib/constants.ts).
 */

import type { Timestamp } from "firebase/firestore";

export type ProfileCompletionStatus = "incomplete" | "complete";

export interface Io2026User {
  displayName?: string;
  email?: string;
  linkedinUrl?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  teamPreference?: "solo" | "team" | "either";
  inPersonAttendance?: "yes" | "no" | "maybe";
  profileCompletionStatus?: ProfileCompletionStatus;
  profileCompletionPercent?: number;
  isPresent?: boolean;
  checkedInAt?: Timestamp;
  role?: "admin" | "moderator" | "user";
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ProjectStatus = "draft" | "submitted" | "finalist" | "winner";

export interface Io2026Project {
  userId: string;
  projectTitle?: string;
  description?: string;
  teamName?: string;
  projectType?: "solo" | "team";
  openToBuddies?: boolean;
  githubUrl?: string;
  demoUrl?: string;
  demoVideoUrl?: string;
  screenshots?: string[];
  members?: { name: string; email?: string; linkedinUrl?: string }[];
  status?: ProjectStatus;
  place?: "first" | "second" | "third" | null;
  builtWith?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Io2026Vote {
  projectId: string;
  userId: string;
  userName?: string;
  timestamp: Timestamp;
  voteCount: number;
  attendanceVerified: boolean;
  hackathonId: "io2026";
}

export interface Io2026Attendance {
  userId: string;
  codeUsed?: string;
  verifiedAt?: Timestamp;
}

export interface Io2026Settings {
  votingOpen?: boolean;
  liveAttendanceCode?: string;
  attendanceWindowOpens?: Timestamp;
  attendanceWindowCloses?: Timestamp;
  currentPitchProjectId?: string | null;
  winnersAnnounced?: boolean;
}
