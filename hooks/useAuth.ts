"use client";

import { useCallback, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createOrUpdateUserProfile, getUserProfile, UserProfile } from "@/lib/auth";
import { recordHackathonParticipationIfNeeded } from "@/lib/participation";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setUserProfile(null);
      return;
    }
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    if (profile) {
      void recordHackathonParticipationIfNeeded(firebaseUser.uid).catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(loadingTimeout);
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Create or update user profile in users collection
          await createOrUpdateUserProfile(firebaseUser);
          
          // Fetch user profile with role
          const profile = await getUserProfile(firebaseUser.uid);
          
          if (profile) {
            setUserProfile(profile);
            void recordHackathonParticipationIfNeeded(firebaseUser.uid).catch(() => {});
          } else {
            // Retry once after a short delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retryProfile = await getUserProfile(firebaseUser.uid);
            setUserProfile(retryProfile);
            if (retryProfile) {
              void recordHackathonParticipationIfNeeded(firebaseUser.uid).catch(() => {});
            }
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          setUserProfile(null);
          if (typeof window !== "undefined") {
            console.error(
              "Profile sync failed. Deploy Cloud Function ensureUserProfile and check Firestore rules."
            );
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    refreshProfile,
  };
}

