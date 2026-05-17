"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import {
  clearPostLoginRedirect,
  consumeGoogleRedirectPending,
  readPostLoginRedirect,
} from "@/lib/auth-redirect";
import { useToast } from "@/hooks/use-toast";

/** Finishes navigation after Google redirect (iOS / Android). Mount once under AuthProvider. */
export function GoogleRedirectComplete() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (!user || handled.current) return;
    if (!consumeGoogleRedirectPending()) return;
    handled.current = true;
    const redirect = readPostLoginRedirect();
    clearPostLoginRedirect();
    toast({ title: "Signed in", description: "Welcome back!" });
    router.replace(redirect && redirect.startsWith("/") ? redirect : "/hackathon");
  }, [user, router, toast]);

  return null;
}
