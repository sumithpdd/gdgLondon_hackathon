"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  subscribeLiveSlide,
  subscribeLiveStats,
  type LiveSlideDoc,
  type LiveStatsSummary,
  DEFAULT_LIVE_SLIDE,
} from "@/lib/live-stats";
import { cn } from "@/lib/utils";
import { Trophy, Users, Vote } from "lucide-react";

export default function LivePage() {
  const [stats, setStats] = useState<LiveStatsSummary | null>(null);
  const [slide, setSlide] = useState<LiveSlideDoc>(DEFAULT_LIVE_SLIDE);

  useEffect(() => {
    const unsubStats = subscribeLiveStats(setStats);
    const unsubSlide = subscribeLiveSlide(setSlide);
    return () => {
      unsubStats();
      unsubSlide();
    };
  }, []);

  const top = useMemo(() => {
    const list = stats?.topProjects ?? [];
    return list.slice(0, slide.showTopN);
  }, [stats, slide.showTopN]);

  const pitchProject = useMemo(() => {
    if (!slide.currentPitchProjectId || !stats?.topProjects) return null;
    return stats.topProjects.find((p) => p.id === slide.currentPitchProjectId) ?? null;
  }, [slide.currentPitchProjectId, stats]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-transparent to-transparent pointer-events-none" />

      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-violet-300 text-sm font-medium tracking-widest uppercase">Projector</p>
          <h1 className="text-3xl md:text-4xl font-bold">{HACKATHON_DISPLAY_NAME}</h1>
        </div>
        <div className="flex gap-8 text-right">
          <StatPill icon={Users} label="Checked in" value={stats?.checkInCount ?? 0} />
          <StatPill icon={Vote} label="Votes cast" value={stats?.totalVotesCast ?? 0} />
        </div>
      </header>

      <main className="relative z-10 px-8 py-10 max-w-6xl mx-auto">
        {slide.mode === "welcome" && (
          <div className="text-center py-20 space-y-6 animate-in fade-in duration-500">
            <h2 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300">
              {slide.headline}
            </h2>
            {slide.subheadline && (
              <p className="text-2xl text-gray-400 max-w-2xl mx-auto">{slide.subheadline}</p>
            )}
          </div>
        )}

        {slide.mode === "pitch" && (
          <div className="text-center py-16 space-y-8">
            <p className="text-violet-400 uppercase tracking-widest text-sm">On stage now</p>
            <h2 className="text-5xl md:text-6xl font-bold">
              {pitchProject?.projectTitle || slide.headline}
            </h2>
            {pitchProject?.teamName && (
              <p className="text-3xl text-gray-400">{pitchProject.teamName}</p>
            )}
            {pitchProject && (
              <p className="text-6xl font-black text-violet-300">{pitchProject.voteTotal} votes</p>
            )}
            {slide.subheadline && <p className="text-xl text-gray-500">{slide.subheadline}</p>}
          </div>
        )}

        {slide.mode === "leaderboard" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold">{slide.headline}</h2>
              {slide.subheadline && <p className="text-xl text-gray-400 mt-2">{slide.subheadline}</p>}
            </div>

            {!stats && (
              <p className="text-center text-gray-500 text-lg">
                Waiting for live stats… Admin can refresh from{" "}
                <Link href="/admin/live" className="text-violet-400 underline">
                  /admin/live
                </Link>
              </p>
            )}

            <ul className="space-y-4">
              {top.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-6 p-6 rounded-2xl border transition-all",
                    i === 0
                      ? "bg-gradient-to-r from-amber-500/20 to-violet-600/20 border-amber-400/40 scale-[1.02]"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "text-4xl font-black w-14 text-center",
                      i === 0 ? "text-amber-300" : "text-violet-400"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-semibold truncate">
                      {p.projectTitle || p.teamName || "Untitled"}
                    </p>
                    {p.teamName && p.projectTitle && (
                      <p className="text-lg text-gray-400 truncate">{p.teamName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.place && (
                      <Trophy className="h-8 w-8 text-amber-400" aria-label={p.place} />
                    )}
                    <span className="text-4xl font-black tabular-nums text-violet-200">{p.voteTotal}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="relative z-10 fixed bottom-0 inset-x-0 px-8 py-3 text-center text-xs text-gray-600 border-t border-white/5">
        Read-only display · updates when votes are cast
      </footer>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold flex items-center justify-end gap-2">
        <Icon className="h-6 w-6 text-violet-400" />
        {value}
      </p>
    </div>
  );
}
