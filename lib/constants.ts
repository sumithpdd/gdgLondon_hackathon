/**
 * Application Constants
 * 
 * Centralized configuration values used throughout the app.
 * Update these values to customize the application behavior.
 */

// Firebase collections - Build with AI Hackathon IWD 2026
// NOTE: Do not expose these values in documentation
export const PROJECTS_COLLECTION = 'hackatonProjects'
export const USERS_COLLECTION = 'hackatonUsers'
export const FIREBASE_STORAGE_FOLDER = 'hackathon_uploads'
export const COMMENTS_SUBCOLLECTION = 'comments'
export const BOOKMARKS_SUBCOLLECTION = 'bookmarks'
export const DISCUSSIONS_COLLECTION = 'hackatonDiscussions'
export const UPDATES_COLLECTION = 'hackatonUpdates'
export const JOIN_REQUESTS_COLLECTION = 'hackatonJoinRequests'
export const CREDIT_CLAIMS_COLLECTION = 'hackatonCreditClaims'

// Legacy (for migration reference only - do not use)
/** @deprecated Use PROJECTS_COLLECTION */
export const FIREBASE_COLLECTION = PROJECTS_COLLECTION

// Build with AI Hackathon - IWD London 2026
export const HACKATHON_START_DATE = new Date('2025-12-09') // Dec 9, 2025
export const HACKATHON_SUBMISSION_DEADLINE = new Date('2026-03-14T09:00:00')
export const BUILT_WITH_OPTIONS = ['OpenAI', 'Claude', 'Gemini', 'Hugging Face', 'Firebase', 'Flutter', 'Vertex AI', 'Cloud Run'] as const
export const AI_CATEGORIES = ['agents', 'ai-apps', 'devtools', 'ai-for-good', 'other'] as const

// File upload limits
export const MAX_SCREENSHOTS = 5
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// Admin session duration (in hours)
export const ADMIN_SESSION_DURATION_HOURS = 24

// Admin credentials (CHANGE FOR PRODUCTION!)
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
} as const

// Submission statuses
export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
} as const

// Winner places
export const WINNER_PLACES = {
  FIRST: 'first',
  SECOND: 'second',
  THIRD: 'third',
} as const

// Allowed image types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

// Toast duration (in milliseconds)
export const TOAST_DURATION = 5000

// Form field limits
export const FORM_LIMITS = {
  fullName: { min: 2, max: 100 },
  email: { max: 100 },
  githubUrl: { max: 200 },
  appPurpose: { min: 10, max: 2000 },
  linkedinUrl: { max: 200 },
  twitterUrl: { max: 200 },
  facebookUrl: { max: 200 },
  instagramUrl: { max: 200 },
  websiteUrl: { max: 200 },
  interest: { max: 50 },
  maxInterests: 10,
}

