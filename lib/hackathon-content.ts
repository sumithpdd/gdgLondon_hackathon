import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SETTINGS_COLLECTION, SETTINGS_DOC_ID } from "./constants";
import {
  DEFAULT_DISCORD_URL,
  DEFAULT_HACKATHON_CONTENT,
  DEFAULT_RESOURCE_LINKS,
  DEFAULT_RESOURCES_INTRO,
  DEFAULT_RULES_SECTIONS,
  DEFAULT_RULES_TITLE,
  RULES_CONTENT_VERSION,
} from "./hackathon-content-defaults";

export type ContentLink = { href: string; label: string };

export type RulesSectionKind = "card" | "list" | "numbered" | "judging" | "warning";
export type RulesSectionVariant = "default" | "violet" | "amber" | "emerald";
export type RulesSectionIcon =
  | "ticket"
  | "shield"
  | "users"
  | "lightbulb"
  | "upload"
  | "award"
  | "gift"
  | "database"
  | "clock";

export type RulesSection = {
  id: string;
  kind: RulesSectionKind;
  title: string;
  body?: string;
  items?: string[];
  variant?: RulesSectionVariant;
  icon?: RulesSectionIcon;
  linkHref?: string;
  linkLabel?: string;
  sortOrder: number;
};

export type HackathonContentDoc = {
  resourcesIntro: string;
  resourceLinks: ContentLink[];
  discordUrl: string;
  rulesTitle: string;
  rulesSections: RulesSection[];
};

function normalizeLink(raw: unknown, index: number): ContentLink | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const href = typeof o.href === "string" ? o.href.trim() : "";
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!href || !label) return null;
  return { href, label };
}

function normalizeSection(raw: unknown, index: number): RulesSection | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : `section-${index}`;
  const title = typeof o.title === "string" ? o.title : "";
  const kind = o.kind as RulesSectionKind;
  if (!title || !kind) return null;
  return {
    id,
    kind,
    title,
    body: typeof o.body === "string" ? o.body : undefined,
    items: Array.isArray(o.items) ? o.items.map(String).filter(Boolean) : undefined,
    variant: (o.variant as RulesSectionVariant) || "default",
    icon: o.icon as RulesSectionIcon | undefined,
    linkHref: typeof o.linkHref === "string" ? o.linkHref : undefined,
    linkLabel: typeof o.linkLabel === "string" ? o.linkLabel : undefined,
    sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : index,
  };
}

export async function fetchHackathonContent(): Promise<HackathonContentDoc> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
    if (!snap.exists()) return DEFAULT_HACKATHON_CONTENT;
    const data = snap.data();

    const resourceLinks = Array.isArray(data.resourceLinks)
      ? data.resourceLinks
          .map((l, i) => normalizeLink(l, i))
          .filter((l): l is ContentLink => l !== null)
      : DEFAULT_RESOURCE_LINKS;

    const rulesVersion =
      typeof data.rulesContentVersion === "number" ? data.rulesContentVersion : 0;
    const rulesSections =
      rulesVersion >= RULES_CONTENT_VERSION && Array.isArray(data.rulesSections)
        ? data.rulesSections
            .map((s, i) => normalizeSection(s, i))
            .filter((s): s is RulesSection => s !== null)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : DEFAULT_RULES_SECTIONS;

    return {
      resourcesIntro:
        typeof data.resourcesIntro === "string" && data.resourcesIntro.trim()
          ? data.resourcesIntro.trim()
          : DEFAULT_RESOURCES_INTRO,
      resourceLinks: resourceLinks.length > 0 ? resourceLinks : DEFAULT_RESOURCE_LINKS,
      discordUrl:
        typeof data.discordUrl === "string" && data.discordUrl.trim()
          ? data.discordUrl.trim()
          : DEFAULT_DISCORD_URL,
      rulesTitle:
        rulesVersion >= RULES_CONTENT_VERSION &&
        typeof data.rulesTitle === "string" &&
        data.rulesTitle.trim()
          ? data.rulesTitle.trim()
          : DEFAULT_RULES_TITLE,
      rulesSections: rulesSections.length > 0 ? rulesSections : DEFAULT_RULES_SECTIONS,
    };
  } catch {
    return DEFAULT_HACKATHON_CONTENT;
  }
}

export async function updateHackathonContent(partial: Partial<HackathonContentDoc>): Promise<void> {
  const payload: Record<string, unknown> = { contentUpdatedAt: new Date() };
  if (partial.resourcesIntro !== undefined) payload.resourcesIntro = partial.resourcesIntro;
  if (partial.resourceLinks !== undefined) payload.resourceLinks = partial.resourceLinks;
  if (partial.discordUrl !== undefined) payload.discordUrl = partial.discordUrl;
  if (partial.rulesTitle !== undefined) payload.rulesTitle = partial.rulesTitle;
  if (partial.rulesSections !== undefined) payload.rulesSections = partial.rulesSections;
  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), payload, { merge: true });
}

export async function seedDefaultHackathonContent(): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
    { ...DEFAULT_HACKATHON_CONTENT, rulesContentVersion: RULES_CONTENT_VERSION },
    { merge: true }
  );
}
