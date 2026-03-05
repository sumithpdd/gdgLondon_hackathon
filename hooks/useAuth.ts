"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createOrUpdateUserProfile, getUserProfile, UserProfile } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
          } else {
            // Retry once after a short delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retryProfile = await getUserProfile(firebaseUser.uid);
            setUserProfile(retryProfile);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUserProfile(null);
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
  };
}

