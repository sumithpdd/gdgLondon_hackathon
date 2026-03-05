import { Roles } from '@/types/globals'
// Note: This function is deprecated as Firebase Auth doesn't support server-side auth in the same way
// Use client-side auth checks with useAuthContext() instead
export const checkRole = async (role: Roles) => {
  // This function cannot be used with Firebase Auth in server components
  // Use ProtectedRoute component with requireAdmin prop instead
  console.warn('checkRole is deprecated with Firebase Auth. Use client-side auth checks.')
  return false
}

