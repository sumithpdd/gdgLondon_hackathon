/**
 * Seed script: adds sample ideas to the Idea Gallery.
 * Run with: node scripts/seed-ideas.mjs
 *
 * Uses Firebase Admin SDK (bypasses security rules).
 * Requires being logged in via `firebase login`.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: "devfestlondon-88398",
});

const db = getFirestore();
const PROJECTS_COLLECTION = "hackatonProjects";

const sampleIdeas = [
  {
    projectTitle: "EcoTrack AI",
    teamName: "Green Innovators",
    projectType: "team",
    appPurpose:
      "An AI-powered app that tracks your daily carbon footprint using photo recognition. Snap a photo of your meal, commute, or purchase and EcoTrack uses Gemini Vision to estimate the environmental impact. Includes weekly reports and community challenges to reduce emissions.",
    builtWith: ["Gemini", "Flutter", "Firebase"],
    lookingForMembers: true,
    teamMembers: [{ name: "Alex Green", email: "alex@example.com" }],
    interests: ["sustainability", "mobile"],
    expertise: ["flutter", "ai"],
    techStack: ["Flutter", "Firebase", "Gemini API"],
    status: "draft",
    screenshots: [],
    demoVideoUrl: "",
    githubUrl: "https://github.com/example/ecotrack-ai",
    fullName: "Alex Green",
    email: "alex@example.com",
    userId: "seed_user_1",
    userEmail: "alex@example.com",
  },
  {
    projectTitle: "StudyBuddy",
    teamName: "LearnTech",
    projectType: "solo",
    appPurpose:
      "An AI tutor that generates personalised study plans and quizzes from any PDF or lecture notes. Upload your material and StudyBuddy creates flashcards, practice questions, and spaced-repetition schedules powered by Claude.",
    builtWith: ["Claude", "Firebase"],
    lookingForMembers: true,
    teamMembers: [],
    interests: ["education", "productivity"],
    expertise: ["react", "ai"],
    techStack: ["Next.js", "Claude API", "Firebase"],
    status: "draft",
    screenshots: [],
    demoVideoUrl: "",
    githubUrl: "https://github.com/example/studybuddy",
    fullName: "Priya Sharma",
    email: "priya@example.com",
    userId: "seed_user_2",
    userEmail: "priya@example.com",
  },
  {
    projectTitle: "CodeReview Copilot",
    teamName: "DevTools Collective",
    projectType: "team",
    appPurpose:
      "A GitHub bot that uses AI to automatically review pull requests, suggest improvements, detect security vulnerabilities, and ensure coding standards. Integrates with your CI/CD pipeline and learns your team's coding style over time.",
    builtWith: ["OpenAI", "Cloud Run"],
    lookingForMembers: true,
    teamMembers: [
      { name: "Marcus Chen", email: "marcus@example.com" },
      { name: "Fatima Al-Rashid", email: "fatima@example.com" },
    ],
    interests: ["devtools", "automation"],
    expertise: ["python", "devops"],
    techStack: ["Python", "OpenAI API", "Cloud Run", "GitHub API"],
    status: "draft",
    screenshots: [],
    demoVideoUrl: "",
    githubUrl: "https://github.com/example/codereview-copilot",
    fullName: "Marcus Chen",
    email: "marcus@example.com",
    userId: "seed_user_3",
    userEmail: "marcus@example.com",
  },
  {
    projectTitle: "MindfulMe",
    teamName: "Wellness AI",
    projectType: "solo",
    appPurpose:
      "A mental wellness companion that uses AI to provide personalised meditation scripts, mood tracking with sentiment analysis, and CBT-based journaling prompts. The app adapts to your emotional patterns and suggests evidence-based exercises.",
    builtWith: ["Gemini", "Flutter", "Vertex AI"],
    lookingForMembers: true,
    teamMembers: [],
    interests: ["health", "ai-for-good"],
    expertise: ["mobile", "ml"],
    techStack: ["Flutter", "Vertex AI", "Firestore"],
    status: "draft",
    screenshots: [],
    demoVideoUrl: "",
    githubUrl: "https://github.com/example/mindfulme",
    fullName: "Jordan Lee",
    email: "jordan@example.com",
    userId: "seed_user_4",
    userEmail: "jordan@example.com",
  },
  {
    projectTitle: "AccessiWeb",
    teamName: "Inclusive Tech",
    projectType: "team",
    appPurpose:
      "An AI-powered browser extension that automatically improves web accessibility. It generates alt text for images, simplifies complex text for cognitive accessibility, adds ARIA labels, and provides real-time accessibility scoring for any webpage.",
    builtWith: ["Claude", "Hugging Face"],
    lookingForMembers: true,
    teamMembers: [{ name: "Sam Okafor", email: "sam@example.com" }],
    interests: ["accessibility", "ai-for-good"],
    expertise: ["javascript", "ai"],
    techStack: ["TypeScript", "Claude API", "Chrome Extension API"],
    status: "draft",
    screenshots: [],
    demoVideoUrl: "",
    githubUrl: "https://github.com/example/accessiweb",
    fullName: "Sam Okafor",
    email: "sam@example.com",
    userId: "seed_user_5",
    userEmail: "sam@example.com",
  },
];

async function seed() {
  console.log("Seeding Idea Gallery...\n");

  for (const idea of sampleIdeas) {
    const now = Timestamp.now();
    const docRef = await db.collection(PROJECTS_COLLECTION).add({
      ...idea,
      createdAt: now,
      createdBy: idea.userId,
      createdDate: now.toDate(),
      updatedAt: now.toDate(),
      updatedBy: idea.userId,
      updatedDate: now.toDate(),
      place: null,
      likes: 0,
      views: 0,
    });
    console.log(`  + ${idea.projectTitle} (${docRef.id})`);
  }

  console.log(`\nDone! Added ${sampleIdeas.length} ideas.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
