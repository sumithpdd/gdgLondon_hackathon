"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createOrUpdateUserProfile } from "@/lib/auth";
import { firebaseAuthErrorMessage } from "@/lib/firebaseAuthErrors";
import { AuthModal } from "@/components/AuthModal";
import { OpenLoginFromQuery, HACKATHON_AUTH_REDIRECT_KEY } from "@/components/OpenLoginFromQuery";
import { useToast } from "@/hooks/use-toast";

type OpenSignInOptions = { forgot?: boolean; redirect?: string };

type HackathonAuthContextValue = {
  openSignIn: (options?: OpenSignInOptions) => void;
  closeSignIn: () => void;
};

const HackathonAuthContext = createContext<HackathonAuthContextValue | null>(null);

export function useHackathonAuth(): HackathonAuthContextValue {
  const ctx = useContext(HackathonAuthContext);
  if (!ctx) {
    throw new Error("useHackathonAuth must be used within HackathonAuthShell");
  }
  return ctx;
}

export function HackathonAuthShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<"signin" | "forgot">("signin");

  const finishAuth = useCallback(() => {
    const redirect =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(HACKATHON_AUTH_REDIRECT_KEY)
        : null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(HACKATHON_AUTH_REDIRECT_KEY);
    }
    setOpen(false);
    router.push(redirect && redirect.startsWith("/") ? redirect : "/hackathon");
  }, [router]);

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    if (options?.redirect && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(HACKATHON_AUTH_REDIRECT_KEY, options.redirect);
    }
    setInitialView(options?.forgot ? "forgot" : "signin");
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setOpen(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(HACKATHON_AUTH_REDIRECT_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ openSignIn, closeSignIn }),
    [openSignIn, closeSignIn]
  );

  useEffect(() => {
    let cancelled = false;
    getRedirectResult(auth)
      .then(async (cred) => {
        if (!cred?.user || cancelled) return;
        await createOrUpdateUserProfile(cred.user);
        toast({ title: "Signed in", description: "Welcome back!" });
        finishAuth();
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          toast({
            title: "Sign-in failed",
            description: firebaseAuthErrorMessage(err),
            variant: "destructive",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [finishAuth, toast]);

  return (
    <HackathonAuthContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <OpenLoginFromQuery
          onOpen={({ forgot, redirect }) => openSignIn({ forgot, redirect })}
        />
      </Suspense>
      <AuthModal
        isOpen={open}
        onClose={closeSignIn}
        onSuccess={finishAuth}
        initialView={initialView}
      />
    </HackathonAuthContext.Provider>
  );
}
