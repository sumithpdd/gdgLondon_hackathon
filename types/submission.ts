/**
 * Build with AI Hackathon - IWD London 2026
 * Submission types supporting both legacy DevFest and new hackathon format
 */

export type ProjectType = "solo" | "team";
export type AICategory = "agents" | "ai-apps" | "devtools" | "ai-for-good" | "other";
export type LabelType = "winner" | "finalist" | "featured" | null;

export interface TeamMember {
  name: string;
  linkedinUrl?: string;
  email?: string;
}

export interface Submission {
  id?: string;
  // Core project info (new hackathon format) - optional for legacy data
  projectTitle?: string;
  teamName?: string;
  projectType?: ProjectType;
  teamMembers?: TeamMember[];
  // Description
  appPurpose: string; // Problem → Solution → Impact
  // Required: demo video (max 3 min)
  demoVideoUrl?: string;
  // Code repository
  githubUrl: string;
  // Optional
  screenshots?: string[];
  designMockups?: string[];
  technicalDocs?: string;
  // AI tools/category
  aiCategory?: AICategory;
  aiToolsUsed?: string[];
  builtWith?: string[]; // OpenAI, Claude, Gemini, Hugging Face, Firebase, etc.
  // Hackathon filters
  projectStartDate?: Date; // Did they begin after hackathon start?
  pitchFinalist?: boolean; // Event day: teams presenting on stage
  // Labels (applied after judging)
  label?: LabelType;
  place?: "first" | "second" | "third" | null;
  // Engagement (denormalized for performance)
  likes?: number;
  views?: number;
  likesBy?: string[]; // user IDs
  commentCount?: number;
  // Legacy / creator info
  fullName: string;
  email: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  interests?: string[];
  userId: string;
  userEmail: string;
  createdAt: Date;
  updatedAt?: Date;
  status?: "draft" | "submitted";
  // Audit (always set on create/update)
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
}
