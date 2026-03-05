/**
 * Validation Utilities
 * 
 * Functions to validate user input and data.
 */

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, FORM_LIMITS } from './constants'

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image (JPG, PNG, GIF, WebP)',
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  if (!url) return true // Optional field
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate GitHub URL
 */
export function validateGitHubUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com'
  } catch {
    return false
  }
}

/**
 * Validate form data
 */
export function validateSubmissionForm(data: {
  fullName: string
  email: string
  githubUrl: string
  appPurpose: string
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Full name
  if (!data.fullName || data.fullName.length < FORM_LIMITS.fullName.min) {
    errors.fullName = `Name must be at least ${FORM_LIMITS.fullName.min} characters`
  }

  // Email
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address'
  }

  // GitHub URL
  if (!validateGitHubUrl(data.githubUrl)) {
    errors.githubUrl = 'Invalid GitHub URL'
  }

  // App purpose
  if (!data.appPurpose || data.appPurpose.length < FORM_LIMITS.appPurpose.min) {
    errors.appPurpose = `Description must be at least ${FORM_LIMITS.appPurpose.min} characters`
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ')
}

