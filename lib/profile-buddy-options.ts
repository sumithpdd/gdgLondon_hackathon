/** Preset chips for Buddies / extended profile (Devcamp-style). */

export const PROGRAMMING_SKILL_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "Git",
  "Bash",
  "Docker",
  "REST APIs",
  "Cloud (AWS/GCP)",
  "Linux",
] as const;

/** Suggestions for combined programming skills + technology stack (profile). */
export const SKILLS_AND_STACK_OPTIONS = [
  ...PROGRAMMING_SKILL_OPTIONS,
  "Next.js",
  ".NET",
  "C#",
  "Java",
  "Kotlin",
  "Flutter",
  "TensorFlow",
  "PyTorch",
  "MongoDB",
  "PostgreSQL",
  "Kubernetes",
  "Firebase",
  "Go",
  "Rust",
] as const;

export function mergeSkillTags(programming?: string[], techStack?: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...(programming ?? []), ...(techStack ?? [])]) {
    const t = tag.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export const DOMAIN_EXPERTISE_OPTIONS = [
  "Machine Learning",
  "Deep Learning",
  "Prompt Engineering",
  "Web Development",
  "Mobile Dev",
  "Data Science",
  "NLP",
  "Computer Vision",
  "MLOps",
  "Data Engineering",
  "LLMs / GenAI",
  "DevOps",
] as const;

export const WANT_TO_LEARN_OPTIONS = [
  "AI Agents",
  "Model Context Protocol (MCP)",
  "Mentorship",
  "Career Advice",
  "Google ADK",
  "Vertex AI",
  "Multi-Agent Systems",
  "TypeScript for AI",
  "Cloud Deployment",
  "Cloud AI Services",
  "Prompt Engineering",
] as const;

export const CAN_OFFER_OPTIONS = [
  "Mentoring",
  "Design Help",
  "Testing",
  "Code Review",
  "Pair Programming",
  "Project Feedback",
  "Study Partner",
  "DevOps Help",
  "Data Analysis",
  "Web Dev Help",
] as const;
