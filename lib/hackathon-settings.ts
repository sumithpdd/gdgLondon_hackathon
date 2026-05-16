import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { SETTINGS_COLLECTION, SETTINGS_DOC_ID } from "./constants";

export type JudgingCriterion = {
  title: string;
  description: string;
};

export const DEFAULT_JUDGING_CRITERIA: JudgingCriterion[] = [
  {
    title: "Uniqueness",
    description: "How original or distinctive is the idea compared to typical AI demos?",
  },
  {
    title: "Completeness",
    description: "Is the solution end-to-end functional, polished, and ready to demo?",
  },
  {
    title: "Fresh idea",
    description: "Does the project bring a new angle, use case, or creative twist?",
  },
  {
    title: "Use of AI technology",
    description: "Is AI used meaningfully—not just a thin wrapper around a single prompt?",
  },
];

export type HackathonSettingsDoc = {
  votingOpensAt?: Date;
  votingClosesAt?: Date;
  winnersAnnounced?: boolean;
  judgingCriteria?: JudgingCriterion[];
  resourceLinks?: { href: string; label: string }[];
};

function parseDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    return (raw as { toDate: () => Date }).toDate();
  }
  return undefined;
}

export async function fetchHackathonSettings(): Promise<HackathonSettingsDoc> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
  if (!snap.exists()) {
    return { judgingCriteria: DEFAULT_JUDGING_CRITERIA };
  }
  const data = snap.data();
  const criteria = Array.isArray(data.judgingCriteria)
    ? (data.judgingCriteria as JudgingCriterion[]).filter((c) => c?.title && c?.description)
    : DEFAULT_JUDGING_CRITERIA;
  const resourceLinks = Array.isArray(data.resourceLinks)
    ? (data.resourceLinks as { href?: string; label?: string }[])
        .filter((l) => l?.href && l?.label)
        .map((l) => ({ href: String(l.href), label: String(l.label) }))
    : undefined;

  return {
    votingOpensAt: parseDate(data.votingOpensAt),
    votingClosesAt: parseDate(data.votingClosesAt),
    winnersAnnounced: Boolean(data.winnersAnnounced),
    judgingCriteria: criteria.length > 0 ? criteria : DEFAULT_JUDGING_CRITERIA,
    resourceLinks,
  };
}

export async function updateVotingWindow(params: {
  votingOpensAt?: Date | null;
  votingClosesAt?: Date | null;
}): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (params.votingOpensAt === null) {
    payload.votingOpensAt = null;
  } else if (params.votingOpensAt) {
    payload.votingOpensAt = Timestamp.fromDate(params.votingOpensAt);
  }
  if (params.votingClosesAt === null) {
    payload.votingClosesAt = null;
  } else if (params.votingClosesAt) {
    payload.votingClosesAt = Timestamp.fromDate(params.votingClosesAt);
  }
  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), payload, { merge: true });
}

export async function updateJudgingCriteria(criteria: JudgingCriterion[]): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
    { judgingCriteria: criteria },
    { merge: true }
  );
}
