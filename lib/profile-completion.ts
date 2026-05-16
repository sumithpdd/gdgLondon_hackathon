import type { UserProfile } from "./auth";

const MIN_BIO_LENGTH = 20;

export type ProfileCompletionResult = {
  percent: number;
  /** Required fields for idea-gallery join requests (team-join score); not required for project drafts on profile — see IO spec §6b */
  complete: boolean;
  /** Blocking gaps (bio, team preference, attendance). */
  missing: string[];
  /** Non-blocking suggestions (e.g. LinkedIn). */
  recommendations: string[];
};

/**
 * Team-join profile score: bio, LinkedIn, team preference, attendance (used for idea-gallery join requests).
 * Used to encourage fuller profiles before join requests (soft gate).
 */
export type ProfileCompletionOptions = {
  /** Set when the user has checked in at `/checkin` (event day). */
  eventCheckedIn?: boolean;
};

export function getProfileCompletion(
  profile: Partial<UserProfile> | null,
  options?: ProfileCompletionOptions
): ProfileCompletionResult {
  if (!profile) {
    return {
      percent: 0,
      complete: false,
      missing: ["Sign in"],
      recommendations: [],
    };
  }

  let score = 0;
  const max = 4;
  const recommendations: string[] = [];

  const bio = (profile.hackathonBio ?? "").trim();
  if (bio.length >= MIN_BIO_LENGTH) score += 1;

  if ((profile.hackathonLinkedinUrl ?? "").trim().length > 0) score += 1;
  else recommendations.push("Add LinkedIn so teams can find you");

  if ((profile.teamPreference ?? "").trim().length > 0) score += 1;

  const checkedIn =
    options?.eventCheckedIn === true ||
    (options?.eventCheckedIn === undefined &&
      profile.inPersonAttendance !== undefined &&
      profile.inPersonAttendance !== null);

  if (checkedIn) score += 1;

  const missing: string[] = [];
  if (bio.length < MIN_BIO_LENGTH) {
    missing.push(`Short bio (${MIN_BIO_LENGTH}+ characters)`);
  }
  if (!(profile.teamPreference ?? "").trim()) {
    missing.push("Team preference (solo / team / flexible)");
  }
  if (profile.inPersonAttendance === undefined || profile.inPersonAttendance === null) {
    missing.push("In-person attendance (yes / no / unsure)");
  }

  const percent = Math.round((score / max) * 100);
  const complete = missing.length === 0;

  return { percent, complete, missing, recommendations };
}

export function isHackathonProfileComplete(
  profile: Partial<UserProfile> | null,
  options?: ProfileCompletionOptions
): boolean {
  return getProfileCompletion(profile, options).complete;
}

/** Rich profile steps (0–10) for progress UI — bio, location, experience, tags, links. */
export function getExtendedProfileSteps(profile: Partial<UserProfile> | null): {
  done: number;
  total: number;
} {
  const total = 11;
  if (!profile) return { done: 0, total };

  let done = 0;
  if ((profile.hackathonBio ?? "").trim().length >= MIN_BIO_LENGTH) done += 1;
  if ((profile.city ?? "").trim()) done += 1;
  if ((profile.country ?? "").trim()) done += 1;
  if (profile.experienceLevel) done += 1;
  if ((profile.programmingSkills ?? []).length > 0) done += 1;
  if ((profile.expertise ?? profile.domainExpertise ?? []).length > 0) done += 1;
  if ((profile.interests ?? profile.wantToLearnTags ?? []).length > 0) done += 1;
  if ((profile.techStack ?? []).length > 0) done += 1;
  if ((profile.canOfferTags ?? []).length > 0) done += 1;
  if ((profile.hackathonLinkedinUrl ?? "").trim()) done += 1;
  if (
    (profile.githubUrl ?? "").trim().length > 0 ||
    (profile.websiteUrl ?? "").trim().length > 0
  ) {
    done += 1;
  }

  return { done, total };
}
