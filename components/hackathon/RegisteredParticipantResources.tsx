"use client";

import Link from "next/link";
import { Cloud, ExternalLink, FileText, Lock } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { hasHackathonParticipation } from "@/lib/participation";
import { getActiveHackathonId, getActiveHackathonName } from "@/lib/active-hackathon";
import { IO2026_PARTICIPANT_ONLY_LINKS } from "@/lib/participant-resources";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { Button } from "@/components/ui/button";

export function RegisteredParticipantResources() {
  const { isAuthenticated, userProfile, loading } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const hackathonId = getActiveHackathonId();
  const eventName = getActiveHackathonName();
  const isRegistered = hasHackathonParticipation(userProfile);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <section className="mt-14 pt-10 border-t border-border rounded-2xl border-dashed border-amber-500/25 bg-amber-500/5 p-8 sm:p-10 text-center space-y-4">
        <Lock className="h-10 w-10 text-amber-400/80 mx-auto" />
        <p className="text-foreground font-semibold text-lg">Participant-only resources</p>
        <p className="text-muted-foreground text-base leading-relaxed mb-2 max-w-md mx-auto">
          Sign in and register for {eventName} to access GCP credits and event codelabs.
        </p>
        <Button type="button" onClick={() => openSignIn()} className="bg-violet-600 hover:bg-violet-500">
          Sign in
        </Button>
      </section>
    );
  }

  if (!isRegistered) {
    return (
      <section className="mt-14 pt-10 border-t border-border rounded-2xl border-dashed border-amber-500/25 bg-amber-500/5 p-8 sm:p-10 text-center space-y-4">
        <Lock className="h-10 w-10 text-amber-400/80 mx-auto" />
        <p className="text-foreground font-semibold text-lg">Participant-only resources</p>
        <p className="text-muted-foreground text-base leading-relaxed mb-2 max-w-md mx-auto">
          Complete hackathon registration ({hackathonId}) to unlock GCP credits and the Google Favourite
          codelabs pack.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-violet-600 hover:bg-violet-500">
            <Link href="/register">Register for the hackathon</Link>
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/hackathon/profile">My profile</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-14 pt-10 border-t border-border space-y-6">
      <p className="text-foreground font-bold text-xl text-center">Participant perks</p>
      <p className="text-muted-foreground text-base leading-relaxed text-center max-w-lg mx-auto">
        For registered {eventName} attendees only — do not share these links publicly.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {IO2026_PARTICIPANT_ONLY_LINKS.map((link, index) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-7 text-left hover:bg-emerald-500/10 transition-colors"
          >
            <span className="inline-flex items-center gap-3 font-semibold text-foreground text-base">
              {index === 0 ? (
                <Cloud className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              {link.label}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
            </span>
            <span className="text-sm text-muted-foreground">{link.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
