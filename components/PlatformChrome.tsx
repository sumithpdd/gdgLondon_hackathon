"use client";

import Image from "next/image";
import { HackathonAppBar } from "@/components/HackathonAppBar";
import { HackathonAuthShell } from "@/components/HackathonAuthShell";
import { HACKATHON_EVENT_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type PlatformChromeProps = {
  children: React.ReactNode;
  /** Main content max width (hackathon pages use narrower column). */
  mainClassName?: string;
  showFooter?: boolean;
  withAuthShell?: boolean;
};

export function PlatformChrome({
  children,
  mainClassName = "w-full max-w-5xl mx-auto px-4 py-8",
  showFooter = true,
  withAuthShell = true,
}: PlatformChromeProps) {
  const body = (
    <div className="min-h-screen bg-background text-foreground bg-gradient-to-b from-background via-background to-muted/40">
      <HackathonAppBar />
      <main className={cn(mainClassName)}>{children}</main>
      {showFooter ? (
        <footer className="border-t border-border mt-12 py-10">
          <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center px-4 py-2 rounded-lg bg-card border border-border shadow-sm">
              <Image
                src="/gdg-london-logo.png"
                alt="GDG London"
                width={100}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </div>
            <p>{HACKATHON_EVENT_TAGLINE}</p>
          </div>
        </footer>
      ) : null}
    </div>
  );

  if (!withAuthShell) return body;
  return <HackathonAuthShell>{body}</HackathonAuthShell>;
}
