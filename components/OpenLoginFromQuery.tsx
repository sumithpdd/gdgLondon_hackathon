"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { savePostLoginRedirect, HACKATHON_AUTH_REDIRECT_KEY } from "@/lib/auth-redirect";

/** When URL has `?login=1`, open sign-in; `&reset=1` opens forgot-password; optional `redirect=` path. */
export function OpenLoginFromQuery({
  onOpen,
}: {
  onOpen: (options: { forgot: boolean; redirect?: string }) => void;
}) {
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("login") !== "1") return;
    handled.current = true;
    const redirect = searchParams.get("redirect")?.trim() || undefined;
    if (redirect && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(REDIRECT_KEY, redirect);
    }
    onOpen({ forgot: searchParams.get("reset") === "1", redirect });
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("login");
      u.searchParams.delete("reset");
      u.searchParams.delete("redirect");
      const next = u.pathname + (u.search || "") + u.hash;
      window.history.replaceState(null, "", next || "/hackathon");
    }
  }, [searchParams, onOpen]);

  return null;
}

export { HACKATHON_AUTH_REDIRECT_KEY };
