"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { OpenLoginFromQuery } from "@/components/OpenLoginFromQuery";
import {
  clearPostLoginRedirect,
  readPostLoginRedirect,
  savePostLoginRedirect,
} from "@/lib/auth-redirect";

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
  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<"signin" | "forgot">("signin");

  const finishAuth = useCallback(() => {
    const redirect = readPostLoginRedirect();
    clearPostLoginRedirect();
    setOpen(false);
    router.push(redirect && redirect.startsWith("/") ? redirect : "/hackathon");
  }, [router]);

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    if (options?.redirect) {
      savePostLoginRedirect(options.redirect);
    }
    setInitialView(options?.forgot ? "forgot" : "signin");
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setOpen(false);
    clearPostLoginRedirect();
  }, []);

  const value = useMemo(
    () => ({ openSignIn, closeSignIn }),
    [openSignIn, closeSignIn]
  );

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
