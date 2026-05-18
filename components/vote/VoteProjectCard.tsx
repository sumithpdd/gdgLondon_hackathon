"use client";

import Link from "next/link";
import { Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VoteableProject } from "@/lib/voting";
import { VOTE_MAX_PER_PROJECT } from "@/lib/voting";

type Props = {
  project: VoteableProject;
  count: number;
  isOwn: boolean;
  votingOpen: boolean;
  remaining: number;
  onChange: (next: number) => void;
};

export function VoteProjectCard({
  project: p,
  count,
  isOwn,
  votingOpen,
  remaining,
  onChange,
}: Props) {
  const title = p.projectTitle || p.teamName || "Untitled";
  const canAdd = votingOpen && !isOwn && count < VOTE_MAX_PER_PROJECT && remaining > 0;

  const setMaxForProject = () => {
    const roomOnProject = VOTE_MAX_PER_PROJECT - count;
    const add = Math.min(roomOnProject, remaining);
    onChange(count + add);
  };

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-200",
        count > 0
          ? "border-violet-500/50 bg-gradient-to-br from-violet-950/50 via-[#14101f] to-black/40 shadow-lg shadow-violet-900/20"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      )}
    >
      {count > 0 ? (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
      ) : null}

      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-lg leading-tight">{title}</h3>
            {p.pitchLine ? (
              <p className="text-sm text-gray-400 line-clamp-2 mt-1">{p.pitchLine}</p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-violet-500/30 bg-violet-500/10 text-violet-200 tabular-nums"
          >
            {p.voteTotal ?? 0} total
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {isOwn ? (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
              Your project — can&apos;t vote for yourself
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-xl border-white/15 bg-black/30"
                disabled={!votingOpen || count <= 0}
                onClick={() => onChange(count - 1)}
                aria-label="Remove vote"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex flex-col items-center min-w-[3.25rem] px-1">
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums leading-none",
                    count > 0 ? "text-violet-300" : "text-gray-500"
                  )}
                >
                  {count}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">votes</span>
              </div>
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 rounded-xl bg-violet-600 hover:bg-violet-500 border-0 shadow-md shadow-violet-900/30"
                disabled={!canAdd}
                onClick={() => onChange(count + 1)}
                aria-label="Add vote"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {votingOpen && remaining > 0 && count < VOTE_MAX_PER_PROJECT ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-violet-500/40 text-violet-200 text-xs h-9"
                  onClick={setMaxForProject}
                >
                  Max
                </Button>
              ) : null}
            </div>
          )}
          <Link
            href={`/hackathon/project/${p.id}`}
            className="text-sm font-medium text-violet-400 hover:text-violet-300 shrink-0 self-end sm:self-center"
          >
            View project →
          </Link>
        </div>
      </div>
    </article>
  );
}
