import type { UserProfile } from "./auth";

const MIN_BIO_LENGTH = 20;

/** Minimum team-join profile score (%) to request joining a project in the idea gallery. */
export const JOIN_PROFILE_MIN_PERCENT = 80;

export type ProfileCompletionResult = {
  percent: number;
  /** Meets threshold for idea-gallery join requests. */
  complete: boolean;
  missing: string[];
  recommendations: string[];
};

/**
 * Team-join profile score: bio, LinkedIn, team preference (check-in is via /checkin on event day, not here).
 */
export function getProfileCompletion(profile: Partial<UserProfile> | null): ProfileCompletionResult {
  if (!profile) {
    return {
      percent: 0,
      complete: false,
      missing: ["Sign in"],
      recommendations: [],
    };
  }

  const max = 3;
  let score = 0;
  const recommendations: string[] = [];

  const bio = (profile.hackathonBio ?? "").trim();
  if (bio.length >= MIN_BIO_LENGTH) score += 1;

  if ((profile.hackathonLinkedinUrl ?? "").trim().length > 0) score += 1;
  else recommendations.push("Add LinkedIn so teams can find you");

  if ((profile.teamPreference ?? "").trim().length > 0) score += 1;

  const missing: string[] = [];
  if (bio.length < MIN_BIO_LENGTH) {
    missing.push(`Short bio (${MIN_BIO_LENGTH}+ characters)`);
  }
  if (!(profile.hackathonLinkedinUrl ?? "").trim()) {
    missing.push("LinkedIn URL");
  }
  if (!(profile.teamPreference ?? "").trim()) {
    missing.push("Team preference (solo / team / flexible)");
  }

  const percent = Math.round((score / max) * 100);
  const complete = percent >= JOIN_PROFILE_MIN_PERCENT;

  return { percent, complete, missing, recommendations };
}

export function isHackathonProfileComplete(profile: Partial<UserProfile> | null): boolean {
  return getProfileCompletion(profile).complete;
}

/** Rich profile steps for progress UI — bio, location, experience, tags, links. */
export function getExtendedProfileSteps(profile: Partial<UserProfile> | null): {
  done: number;
  total: number;
} {
  const total = 10;
  if (!profile) return { done: 0, total };

  let done = 0;
  if ((profile.hackathonBio ?? "").trim().length >= MIN_BIO_LENGTH) done += 1;
  if ((profile.city ?? "").trim()) done += 1;
  if ((profile.country ?? "").trim()) done += 1;
  if (profile.experienceLevel) done += 1;
  const skills = [
    ...(profile.programmingSkills ?? profile.skills ?? []),
    ...(profile.techStack ?? []),
  ];
  if (skills.length > 0) done += 1;
  if ((profile.expertise ?? profile.domainExpertise ?? []).length > 0) done += 1;
  if ((profile.interests ?? profile.wantToLearnTags ?? []).length > 0) done += 1;
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
