"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type WinnerPlace = "first" | "second" | "third";

export interface ResultsSummaryProject {
  place?: WinnerPlace | null;
  status?: string;
  fullName?: string;
  teamName?: string;
  projectTitle?: string;
  teamMembers?: { name?: string }[];
}

function winnerDisplayName(p: ResultsSummaryProject | undefined): string | null {
  if (!p) return null;
  if (p.fullName?.trim()) return p.fullName.trim();
  const member = p.teamMembers?.find((m) => m.name?.trim());
  if (member?.name?.trim()) return member.name.trim();
  if (p.teamName?.trim()) return p.teamName.trim();
  if (p.projectTitle?.trim()) return p.projectTitle.trim();
  return null;
}

function computeStats(projects: ResultsSummaryProject[]) {
  const submitted = projects.filter(
    (p) => p.status === "submitted" || p.status === "finalist" || p.status === "winner"
  ).length;
  const drafts = projects.filter((p) => p.status === "draft").length;
  const winnersSelected = projects.filter((p) => p.place).length;
  return {
    total: projects.length,
    submitted,
    drafts,
    winnersSelected,
  };
}

const PLACE_LABELS: Record<WinnerPlace, string> = {
  first: "🥇 First place",
  second: "🥈 Second place",
  third: "🥉 Third place",
};

export function HackathonResultsSummary({
  projects,
  title = "Competition winners",
}: {
  projects: ResultsSummaryProject[];
  title?: string;
}) {
  const winners = {
    first: projects.find((p) => p.place === "first"),
    second: projects.find((p) => p.place === "second"),
    third: projects.find((p) => p.place === "third"),
  };
  const stats = computeStats(projects);

  return (
    <div className="space-y-6">
      <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#1a1528]/80 to-[#1a1528]/90 shadow-lg shadow-amber-900/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <CardTitle className="text-white">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {(["first", "second", "third"] as const).map((place) => {
              const row = winners[place];
              const name = winnerDisplayName(row);
              return (
                <div
                  key={place}
                  className="rounded-xl border border-white/10 bg-[#0f0a18]/80 p-4"
                >
                  <h4 className="font-semibold text-white mb-2">{PLACE_LABELS[place]}</h4>
                  {name ? (
                    <p className="text-sm text-gray-300">{name}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Not recorded</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats.total} label="Total submissions" valueClass="text-violet-300" />
        <StatCard value={stats.submitted} label="Submitted" valueClass="text-emerald-400" />
        <StatCard value={stats.drafts} label="Drafts" valueClass="text-amber-300" />
        <StatCard value={stats.winnersSelected} label="Winners selected" valueClass="text-fuchsia-300" />
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  valueClass,
}: {
  value: number;
  label: string;
  valueClass: string;
}) {
  return (
    <Card className="border-white/10 bg-[#1a1528]/70">
      <CardContent className="pt-6">
        <div className="text-center">
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
