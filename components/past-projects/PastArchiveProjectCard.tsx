"use client";

import Image from "next/image";
import { Github, ExternalLink, Trophy, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ArchivedProject } from "@/lib/archived-hackathon";
import { getArchiveProjectTitle, isLowQualityArchiveProject } from "@/lib/archived-hackathon";
import { cn } from "@/lib/utils";

const PLACE_LABEL: Record<string, string> = {
  first: "1st",
  second: "2nd",
  third: "3rd",
};

type Props = {
  project: ArchivedProject;
  showIdeaBadge?: boolean;
  isAdmin?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void;
};

export function PastArchiveProjectCard({
  project: p,
  showIdeaBadge = false,
  isAdmin = false,
  isDeleting = false,
  onDelete,
}: Props) {
  const title = getArchiveProjectTitle(p);
  const banner = p.screenshots?.[0];
  const lowQuality = isLowQualityArchiveProject(p);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-[#12121a] shadow-lg transition-colors hover:border-pink-500/30",
        lowQuality ? "border-amber-500/35" : "border-white/10"
      )}
    >
      <div className="relative h-36 overflow-hidden">
        {banner ? (
          <Image
            src={banner}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-pink-900/50 to-[#12121a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {showIdeaBadge && p.lookingForMembers ? (
            <span className="rounded-full bg-violet-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              Idea gallery
            </span>
          ) : null}
          {lowQuality ? (
            <span className="rounded-full bg-amber-600/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              Review
            </span>
          ) : null}
        </div>
        {p.place ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 backdrop-blur-sm">
            <Trophy className="h-3 w-3" />
            {PLACE_LABEL[p.place] || p.place}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-2 -mt-6 relative">
        <div className="flex gap-3 items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#1a1a24] text-lg font-bold text-white shadow-md">
            {title[0]?.toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-lg font-bold text-white">{title}</h3>
            {p.teamName && p.teamName !== title ? (
              <p className="text-sm text-violet-300 truncate">{p.teamName}</p>
            ) : null}
            {p.appPurpose ? (
              <p className="line-clamp-2 text-sm text-gray-400 mt-1">{p.appPurpose}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {p.githubUrl ? (
            <a
              href={p.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              <Github className="h-3 w-3" /> GitHub
            </a>
          ) : null}
          {p.demoVideoUrl ? (
            <a
              href={p.demoVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Demo
            </a>
          ) : null}
          {p.status ? (
            <Badge variant="outline" className="border-white/15 text-gray-400 text-[10px]">
              {p.status}
            </Badge>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-xs text-gray-500 italic">IWD 2026 archive</p>
          {isAdmin && onDelete ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isDeleting}
              onClick={onDelete}
              className="border-red-500/40 text-red-300 hover:bg-red-500/10 h-8"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
