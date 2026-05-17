"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Square } from "lucide-react";
import { fetchHackathonContent, type ContentLink } from "@/lib/hackathon-content";
import {
  DEFAULT_DISCORD_URL,
  DEFAULT_RESOURCE_LINKS,
  DEFAULT_RESOURCES_INTRO,
} from "@/lib/hackathon-content-defaults";
import { HackathonRulesFromSettings } from "@/components/HackathonRulesFromSettings";
import { RegisteredParticipantResources } from "@/components/hackathon/RegisteredParticipantResources";

export function HackathonResourcesFromSettings() {
  const [intro, setIntro] = useState(DEFAULT_RESOURCES_INTRO);
  const [links, setLinks] = useState<ContentLink[]>(DEFAULT_RESOURCE_LINKS);
  const [discordUrl, setDiscordUrl] = useState(DEFAULT_DISCORD_URL);

  useEffect(() => {
    void fetchHackathonContent().then((c) => {
      setIntro(c.resourcesIntro);
      setLinks(c.resourceLinks);
      setDiscordUrl(c.discordUrl);
    });
  }, []);

  return (
    <div className="page-stack max-w-3xl mx-auto">
      <section className="rounded-3xl overflow-hidden">
        <div className="p-10 sm:p-14 bg-card border border-border rounded-t-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 flex items-center gap-4 justify-center">
            <span className="flex gap-1" aria-hidden>
              <Square className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              <Square className="w-4 h-4 fill-amber-500 text-amber-500" />
              <Square className="w-4 h-4 fill-rose-500 text-rose-500" />
            </span>
            Resources &amp; learning
          </h1>
          <p className="text-muted-foreground text-center text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
            {intro}
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-7 py-5 rounded-2xl border-2 border-border bg-muted/30 text-foreground text-base font-medium hover:bg-accent transition-colors"
              >
                <FileText className="w-5 h-5 shrink-0 text-violet-400" />
                {link.label}
              </a>
            ))}
          </div>

          <RegisteredParticipantResources />

          <div className="mt-14 pt-10 border-t border-border text-center space-y-4">
            <p className="text-foreground font-bold text-xl">Need help? Have questions?</p>
            <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
              Hackathon Q&amp;A and community support — join the Discord.
            </p>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-base font-semibold transition-colors shadow-lg shadow-[#5865F2]/25"
            >
              Join our Discord
            </a>
          </div>
        </div>
        <div className="h-12 bg-gradient-to-b from-card to-background" />
      </section>

      <p className="text-center text-base text-muted-foreground">
        Past side events are archived on{" "}
        <Link href="/past-projects#past-hackathons" className="text-primary hover:underline">
          Past projects
        </Link>
        .
      </p>

      <div id="rules" className="scroll-mt-28">
        <HackathonRulesFromSettings />
      </div>
    </div>
  );
}
