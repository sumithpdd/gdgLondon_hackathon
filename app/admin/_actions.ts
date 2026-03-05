'use server'

import { revalidatePath } from 'next/cache'

// Note: These server actions are deprecated with Firebase Auth
// Role management should be done through client-side Firebase operations
// or through Firebase Admin SDK in API routes

export async function setRole(formData: FormData) {
  // This function is deprecated with Firebase Auth
  // Use client-side Firestore updates instead
  console.error('setRole server action is not supported with Firebase Auth')
  return { error: 'This feature requires client-side implementation with Firebase' }
}

export async function removeRole(formData: FormData) {
  // This function is deprecated with Firebase Auth
  // Use client-side Firestore updates instead
  console.error('removeRole server action is not supported with Firebase Auth')
  return { error: 'This feature requires client-side implementation with Firebase' }
}

