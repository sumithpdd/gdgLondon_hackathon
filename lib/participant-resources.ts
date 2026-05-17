/**
 * Links shown only to participants registered for the active IO 2026 hackathon.
 * Do not render these URLs in public HTML for guests.
 */

export type ParticipantOnlyLink = {
  href: string;
  label: string;
  description: string;
};

export const IO2026_GCP_CREDIT_CLAIM_URL =
  "https://trygcp.dev/claim/deveco-gdg-cc4a8035784";

export const IO2026_FAVOURITE_CODELABS_URL =
  "https://drive.google.com/file/d/165eSOLdPpGd22D2ijgGvpxbQapRuFRJu/view";

export const IO2026_PARTICIPANT_ONLY_LINKS: ParticipantOnlyLink[] = [
  {
    href: IO2026_GCP_CREDIT_CLAIM_URL,
    label: "Claim Google Cloud credits",
    description: "Redeem your event GCP credit via trygcp.dev (one-time claim link).",
  },
  {
    href: IO2026_FAVOURITE_CODELABS_URL,
    label: "Google Favourite codelabs",
    description: "Curated codelabs handout for Build with AI × I/O 2026.",
  },
];
