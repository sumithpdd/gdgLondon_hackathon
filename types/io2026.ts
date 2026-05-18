/**
 * Firestore shapes for io2026Hackathon_* (live) and iwd2026Hackathon_* (archive).
 * Canonical field detail: docs/DATA_MODEL.md
 */

import type { Timestamp } from "firebase/firestore";

export type ProfileCompletionStatus = "incomplete" | "complete";

export type UserRole = "admin" | "moderator" | "user";

export interface Io2026User {
  uid?: string;
  displayName?: string;
  email?: string;
  linkedinUrl?: string;
  hackathonBio?: string;
  profileDisplayName?: string;
  skills?: string[];
  interests?: string[];
  teamPreference?: "solo" | "team" | "either";
  inPersonAttendance?: boolean | null;
  profileCompletionStatus?: ProfileCompletionStatus;
  profileCompletionPercent?: number;
  role?: UserRole;
  hackathonParticipations?: Record<string, { joinedAt?: Timestamp }>;
  adminProvisioned?: boolean;
  profileStatus?: "provisioned" | "active";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ProjectStatus = "draft" | "submitted" | "finalist" | "winner";

export interface Io2026Project {
  userId: string;
  userEmail?: string;
  projectTitle?: string;
  teamName?: string;
  pitchLine?: string;
  appPurpose?: string;
  projectType?: "solo" | "team";
  teamMembers?: { name: string; linkedinUrl?: string }[];
  githubUrl?: string;
  demoVideoUrl?: string;
  screenshots?: string[];
  status?: ProjectStatus;
  place?: "first" | "second" | "third" | null;
  hackathonId: string;
  hackathonName?: string;
  voteTotal?: number;
  builtWith?: string[];
  lookingForMembers?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Io2026Vote {
  userId: string;
  projectId: string;
  hackathonId: string;
  voteCount: number;
  attendanceVerified?: boolean;
  userName?: string;
  timestamp?: Timestamp;
}

/** Doc id = userId */
export type AttendanceCohort = "aidevcamp2026" | "aidevcamp_flat" | null;

export interface Io2026Attendance {
  userId: string;
  checkedInAt?: Timestamp;
  checkedInByUid?: string;
  method?: "self" | "admin" | "staff";
  attendanceVerified: boolean;
  cohort?: AttendanceCohort;
  swagReceived?: boolean;
  swagReceivedAt?: Timestamp;
  swagReceivedByUid?: string;
}

export interface Io2026SettingsMain {
  winnersAnnounced?: boolean;
  winnersAnnouncedAt?: Timestamp;
  votingOpensAt?: Timestamp;
  votingClosesAt?: Timestamp;
  prizes?: {
    id: string;
    name: string;
    imageSrc: string;
    featured?: boolean;
    sortOrder: number;
  }[];
  judgingCriteria?: { title: string; description: string }[];
  resourcesIntro?: string;
  rulesTitle?: string;
}

export interface Io2026CheckInPublic {
  attendanceWindowOpensAt?: Timestamp;
  attendanceWindowClosesAt?: Timestamp;
}

export interface Io2026LiveStats {
  checkInCount?: number;
  totalVotesCast?: number;
  topProjects?: { id: string; voteTotal: number; projectTitle?: string }[];
  updatedAt?: Timestamp;
}
