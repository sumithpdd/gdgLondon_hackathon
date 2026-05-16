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
    <div className="space-y-12 max-w-3xl mx-auto">
      <section className="rounded-3xl overflow-hidden">
        <div className="p-8 sm:p-12 bg-card border border-border rounded-t-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3 justify-center">
            <div className="flex gap-0.5">
              <Square className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              <Square className="w-3 h-3 fill-amber-500 text-amber-500" />
              <Square className="w-3 h-3 fill-rose-500 text-rose-500" />
            </div>
            Resources &amp; learning
          </h1>
          <p className="text-muted-foreground text-center mb-10">{intro}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border-2 border-border bg-muted/30 text-foreground font-medium hover:bg-accent transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border text-center">
            <p className="text-foreground font-bold text-lg mb-1">Need help? Have questions?</p>
            <p className="text-muted-foreground text-sm mb-4">
              Hackathon Q&amp;A and community support — join the Discord.
            </p>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors shadow-lg shadow-[#5865F2]/25"
            >
              Join our Discord
            </a>
          </div>
        </div>
        <div className="h-12 bg-gradient-to-b from-card to-background" />
      </section>

      <p className="text-center text-sm text-muted-foreground">
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
