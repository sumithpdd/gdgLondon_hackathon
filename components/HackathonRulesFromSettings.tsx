"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  Lightbulb,
  Award,
  Clock,
  Users,
  Ticket,
  Gift,
  Shield,
  Database,
  type LucideIcon,
} from "lucide-react";
import { HackathonJudgingCriteriaList } from "@/components/HackathonJudgingCriteriaList";
import {
  fetchHackathonContent,
  type RulesSection,
  type RulesSectionIcon,
} from "@/lib/hackathon-content";
import { DEFAULT_RULES_SECTIONS, DEFAULT_RULES_TITLE } from "@/lib/hackathon-content-defaults";
import { cn } from "@/lib/utils";

const ICONS: Record<RulesSectionIcon, LucideIcon> = {
  ticket: Ticket,
  shield: Shield,
  users: Users,
  lightbulb: Lightbulb,
  upload: Upload,
  award: Award,
  gift: Gift,
  database: Database,
  clock: Clock,
};

function variantClasses(variant?: string) {
  if (variant === "violet") return "bg-violet-600/20 border-violet-500/30";
  if (variant === "amber") return "bg-amber-500/15 border-2 border-amber-400/50 shadow-[0_0_30px_-8px_rgba(251,191,36,0.3)]";
  if (variant === "emerald") return "bg-card border-emerald-500/30";
  return "bg-card border-border";
}

function SectionBlock({ section }: { section: RulesSection }) {
  const Icon = section.icon ? ICONS[section.icon] : null;

  if (section.kind === "warning") {
    return (
      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-amber-400">⚠</span>
          {section.title}
        </h3>
        {section.body && <p className="text-muted-foreground mb-4">{section.body}</p>}
        {section.items && (
          <ul className="space-y-2 text-muted-foreground">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-rose-400">✕</span> {item}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (section.kind === "numbered" && section.items) {
    return (
      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-violet-400" />}
          {section.title}
        </h3>
        {section.body && <p className="text-muted-foreground mb-6">{section.body}</p>}
        <div className="space-y-4">
          {section.items.map((text, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-foreground/90">{text}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.kind === "judging") {
    return (
      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-violet-400" />}
          {section.title}
        </h3>
        {section.body && <p className="text-muted-foreground text-sm mb-4">{section.body}</p>}
        <HackathonJudgingCriteriaList />
      </section>
    );
  }

  return (
    <Card className={cn("text-left", variantClasses(section.variant))}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-violet-400" />}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-muted-foreground">
        {section.body &&
          section.body.split("\n\n").map((para, i) => (
            <p key={i}>
              {para.includes("Prizes page") ? (
                <>
                  {para.split("Prizes page")[0]}
                  <Link href="/hackathon/prizes" className="text-primary font-semibold underline">
                    Prizes page
                  </Link>
                  {para.split("Prizes page")[1]}
                </>
              ) : (
                para
              )}
            </p>
          ))}
        {section.items && (
          <ul className="list-disc pl-6 space-y-1">
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
        {section.linkHref && section.linkLabel && (
          <a
            href={section.linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-semibold underline"
          >
            {section.linkLabel}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function HackathonRulesFromSettings() {
  const [sections, setSections] = useState<RulesSection[]>(DEFAULT_RULES_SECTIONS);
  const [title, setTitle] = useState(DEFAULT_RULES_TITLE);

  useEffect(() => {
    void fetchHackathonContent().then((c) => {
      if (c.rulesSections?.length) setSections(c.rulesSections);
      if (c.rulesTitle) setTitle(c.rulesTitle);
    });
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground text-center">{title}</h2>
      {sections.map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}
    </div>
  );
}

