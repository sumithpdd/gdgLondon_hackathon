import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { USERS_COLLECTION } from "./constants";
import { User } from "firebase/auth";

export type UserRole = "admin" | "moderator" | "user";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role || "user",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        createdDate: data.createdDate?.toDate?.(),
        updatedDate: data.updatedDate?.toDate?.(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Create or update user profile in Firestore
 * This is called automatically when a user signs in or signs up
 */
export async function createOrUpdateUserProfile(user: User): Promise<void> {
  if (!user || !user.uid) {
    console.error('Cannot create profile: Invalid user object');
    return;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userRef);
    
    const now = new Date();
    if (!userDoc.exists()) {
      // Create new user profile with default role
      const newUserData = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        role: "user",
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        updatedBy: user.uid,
        createdDate: now,
        updatedDate: now,
      };
      
      await setDoc(userRef, newUserData);
    } else {
      // Update existing user profile
      const updates = {
        email: user.email,
        displayName: user.displayName || userDoc.data().displayName,
        updatedAt: now,
        updatedBy: user.uid,
        updatedDate: now,
      };
      
      await setDoc(userRef, updates, { merge: true });
    }
  } catch (error: any) {
    console.error("Error creating/updating user profile:", error.code || error.message);
  }
}

/**
 * Check if the current user has admin role
 * 
 * To set up admin users:
 * 1. Go to Firebase Console → Firestore Database
 * 2. Find the user document in the users collection (see constants)
 * 3. Update the 'role' field to 'admin'
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  
  const profile = await getUserProfile(uid);
  return profile?.role === "admin";
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  const profile = await getUserProfile(uid);
  return profile?.role || "user";
}

