"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
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

function SectionHeading({
  title,
  icon,
  emoji,
}: {
  title: string;
  icon?: LucideIcon | null;
  emoji?: string;
}) {
  return (
    <h3 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3 sm:gap-4">
      {emoji ? (
        <span className="icon-badge text-amber-400 text-2xl" aria-hidden>
          {emoji}
        </span>
      ) : icon ? (
        <SectionIcon icon={icon} />
      ) : null}
      {title}
    </h3>
  );
}

function SectionBlock({ section }: { section: RulesSection }) {
  const Icon = section.icon ? ICONS[section.icon] : null;

  if (section.kind === "warning") {
    return (
      <section className="content-card text-left space-y-5">
        <SectionHeading title={section.title} emoji="⚠" />
        {section.body && <p className="prose-muted">{section.body}</p>}
        {section.items && (
          <ul className="space-y-3 prose-muted">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-rose-400 text-lg leading-none mt-0.5" aria-hidden>
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (section.kind === "numbered" && section.items) {
    return (
      <section className="content-card text-left space-y-6">
        <SectionHeading title={section.title} icon={Icon} />
        {section.body && <p className="prose-muted">{section.body}</p>}
        <div className="space-y-4">
          {section.items.map((text, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-muted/50 border border-border"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base">
                {i + 1}
              </span>
              <span className="text-foreground/90 text-base leading-relaxed pt-1.5">{text}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.kind === "judging") {
    return (
      <section className="content-card text-left space-y-5">
        <SectionHeading title={section.title} icon={Icon} />
        {section.body && <p className="prose-muted">{section.body}</p>}
        <HackathonJudgingCriteriaList />
      </section>
    );
  }

  return (
    <Card className={cn("text-left rounded-3xl shadow-sm", variantClasses(section.variant))}>
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center gap-3 sm:gap-4">
          {Icon ? <SectionIcon icon={Icon} /> : null}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground text-base leading-relaxed">
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
          <ul className="list-disc pl-6 space-y-2">
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
            className="inline-flex items-center gap-2 text-primary font-semibold underline text-base"
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
    <div className="page-stack">
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center">{title}</h2>
      {sections.map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}
    </div>
  );
}
