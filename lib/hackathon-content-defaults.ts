import type { ContentLink, HackathonContentDoc, RulesSection } from "./hackathon-content";

export const DEFAULT_RESOURCE_LINKS: ContentLink[] = [
  { href: "https://huggingface.co/docs", label: "Hugging Face Docs" },
  { href: "https://platform.openai.com/docs", label: "OpenAI API Docs" },
  { href: "https://ai.google.dev/docs", label: "Gemini API Docs" },
  { href: "https://aistudio.google.com/", label: "AI Studio" },
];

export const DEFAULT_RESOURCES_INTRO =
  "Explore tools and APIs to help you build with AI — use any AI technology you prefer";

export const DEFAULT_DISCORD_URL = "https://discord.com/invite/QujDVuNJ";

export const DEFAULT_RULES_TITLE = "Rules & requirements";

export const DEFAULT_RULES_SECTIONS: RulesSection[] = [
  {
    id: "ticket",
    kind: "card",
    title: "Event ticket required",
    body: "You need a valid ticket for the event to participate in this hackathon.",
    variant: "violet",
    icon: "ticket",
    linkHref: "https://luma.com/urm40pjn",
    linkLabel: "Get your ticket on Luma (I/O Watch Party + hack night) →",
    sortOrder: 0,
  },
  {
    id: "eligibility",
    kind: "card",
    title: "Eligibility",
    body: "Event organisers, speakers, and volunteers cannot and will not participate in the hackathon.",
    icon: "shield",
    sortOrder: 1,
  },
  {
    id: "teams",
    kind: "card",
    title: "Teams",
    items: [
      "Solo builder or Team (max 4 members)",
      "Create an idea and allow others to join, or join an existing team with approval",
    ],
    icon: "users",
    sortOrder: 2,
  },
  {
    id: "ideas",
    kind: "card",
    title: "Create or join a project idea",
    body: "When registering your idea, you will provide:",
    items: ["Project Title", "Team Name", "Solo or Group project", "Team members (optional)", "LinkedIn profile"],
    icon: "lightbulb",
    sortOrder: 3,
  },
  {
    id: "avoid",
    kind: "warning",
    title: "Avoid these project types",
    body: "In the Action Era, if a single prompt can solve it, it's not an application.",
    items: [
      "Baseline RAG — Simple data retrieval is now a baseline feature",
      "Prompt-Only Wrappers — System prompts in a basic UI",
      "Simple Vision Analyzers — Basic object identification",
      "Generic Chatbots — Standard bots for nutrition, job screening",
      "Medical Advice — No diagnostic advice projects",
    ],
    sortOrder: 4,
  },
  {
    id: "submit",
    kind: "numbered",
    title: "What to submit",
    body: "Each submission must include:",
    items: [
      "A working project",
      "A demo video (max 3 minutes) — Show the app in action and explain what it does.",
      "Project description — Explain the problem, the idea, and how the solution works.",
      "Code repository link (GitHub or similar). If private, provide read access to the judges.",
    ],
    icon: "upload",
    sortOrder: 5,
  },
  {
    id: "judging",
    kind: "judging",
    title: "Judging criteria",
    body: "Audience voting picks winners by total votes. Use these lenses when deciding where to allocate yours (max 2 per project).",
    icon: "award",
    sortOrder: 6,
  },
  {
    id: "prizes",
    kind: "card",
    title: "Winning prizes — important",
    body: "🎉 Prizes are handed out live on event day — be there in person to claim your glory.\n\nShow up, win big! No mail, no exceptions. See the current prize pool on the Prizes page (synced from the database).\n\nTeam projects — prize goes to the project leader. How you share it with your team is entirely up to you.",
    variant: "amber",
    icon: "gift",
    sortOrder: 7,
  },
  {
    id: "data",
    kind: "card",
    title: "Your data",
    body: "Your submission data is stored for 30 days after the event and is not shared outside the competition. We keep it simple: your info stays in-house for judging and event purposes only.",
    variant: "emerald",
    icon: "database",
    sortOrder: 8,
  },
  {
    id: "deadline",
    kind: "card",
    title: "Submission deadline",
    body: "Friday, 13 March 2026 — 23:59",
    variant: "violet",
    icon: "clock",
    sortOrder: 9,
  },
];

export const DEFAULT_HACKATHON_CONTENT: HackathonContentDoc = {
  resourcesIntro: DEFAULT_RESOURCES_INTRO,
  resourceLinks: DEFAULT_RESOURCE_LINKS,
  discordUrl: DEFAULT_DISCORD_URL,
  rulesTitle: DEFAULT_RULES_TITLE,
  rulesSections: DEFAULT_RULES_SECTIONS,
};
