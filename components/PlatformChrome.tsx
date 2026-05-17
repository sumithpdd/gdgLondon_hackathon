"use client";

import Image from "next/image";
import Link from "next/link";
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
          <div className="container mx-auto px-4 max-w-6xl flex flex-col items-center gap-6 text-center text-sm text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
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
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link
                href="/code-of-conduct"
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                Code of Conduct
              </Link>
              <Link
                href="/hackathon/resources#rules"
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                Rules
              </Link>
              <Link
                href="/hackathon/prizes"
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                Prizes
              </Link>
              <a
                href="mailto:hello@gdglondon.dev"
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                Contact
              </a>
            </nav>
          </div>
        </footer>
      ) : null}
    </div>
  );

  if (!withAuthShell) return body;
  return <HackathonAuthShell>{body}</HackathonAuthShell>;
}
