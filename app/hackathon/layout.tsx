"use client";

import Image from "next/image";
import { HackathonAppBar } from "@/components/HackathonAppBar";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-to-b from-background via-background to-muted/40">
      <HackathonAppBar />

      <main className="w-full max-w-5xl mx-auto px-4 py-8">{children}</main>

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
          <p>{HACKATHON_DISPLAY_NAME} — IWD / IO London</p>
        </div>
      </footer>
    </div>
  );
}
