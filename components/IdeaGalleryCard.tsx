"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, UserPlus, Loader2, Vote } from "lucide-react";
import { Submission } from "@/types/submission";
import { getProjectTitle } from "@/lib/submission-utils";
import {
  getPitchLine,
  getProjectStage,
  getCategoryLabel,
  getOpenAsks,
  getFounderName,
  PROJECT_STAGE_LABELS,
} from "@/lib/idea-gallery";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  submission: Submission;
  readOnly?: boolean;
  isOwner?: boolean;
  isAuthenticated?: boolean;
  userHasProject?: boolean;
  profileComplete?: boolean;
  hasRequested?: boolean;
  isRequesting?: boolean;
  /** When false, show view-only (submitted but not recruiting). */
  canRequestJoin?: boolean;
  onRequestJoin?: () => void;
  onSignIn?: () => void;
};

function FounderAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }
  const initial = (name[0] || "?").toUpperCase();
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-xs font-bold text-white ring-2 ring-white/10">
      {initial}
    </span>
  );
}

export function IdeaGalleryCard({
  submission: s,
  readOnly = false,
  isOwner = false,
  isAuthenticated = false,
  userHasProject = false,
  profileComplete = true,
  hasRequested = false,
  isRequesting = false,
  canRequestJoin = true,
  onRequestJoin,
  onSignIn,
}: Props) {
  const title = getProjectTitle(s);
  const banner = s.screenshots?.[0];
  const stage = getProjectStage(s);
  const category = getCategoryLabel(s);
  const openAsks = getOpenAsks(s);
  const founder = getFounderName(s);
  const voteCount = Number(s.voteTotal) || 0;
  const showVotes = s.status === "submitted" || voteCount > 0;

  const actionButton = () => {
    if (readOnly) return null;
    if (isOwner) {
      return (
        <p className="text-xs text-gray-500 italic text-right">Your project</p>
      );
    }
    if (!isAuthenticated) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 gap-1.5"
          onClick={onSignIn}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Message
        </Button>
      );
    }
    if (userHasProject) {
      return (
        <Button size="sm" variant="outline" className="border-white/10 text-gray-500" disabled>
          In a project
        </Button>
      );
    }
    if (!canRequestJoin) {
      return detailHref ? (
        <Button size="sm" variant="outline" className="border-white/20 text-gray-300" asChild>
          <Link href={detailHref}>View project</Link>
        </Button>
      ) : null;
    }
    if (!profileComplete) {
      return (
        <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200" asChild>
          <Link href="/hackathon/profile">Complete profile</Link>
        </Button>
      );
    }
    if (hasRequested) {
      return (
        <Button size="sm" variant="outline" className="border-white/10 text-gray-400" disabled>
          Request sent
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-white/20 text-white hover:bg-pink-500/20 hover:border-pink-500/40 gap-1.5"
        onClick={onRequestJoin}
        disabled={isRequesting}
      >
        {isRequesting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {isRequesting ? "Sending…" : "Request"}
      </Button>
    );
  };

  const detailHref = s.id ? `/hackathon/project/${s.id}` : undefined;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-lg transition-colors hover:border-pink-500/30">
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
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-200 backdrop-blur-sm">
            {PROJECT_STAGE_LABELS[stage]}
          </span>
          {s.lookingForMembers ? (
            <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              Recruiting
            </span>
          ) : null}
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {showVotes ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm tabular-nums"
              title="Total audience votes"
            >
              <Vote className="h-3 w-3 shrink-0" aria-hidden />
              {voteCount} {voteCount === 1 ? "vote" : "votes"}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm",
              "bg-pink-600/80 text-white"
            )}
          >
            {category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-2 -mt-6 relative">
        <div className="flex gap-3 items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#1a1a24] text-lg font-bold text-white shadow-md">
            {title[0]?.toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            {detailHref ? (
              <Link href={detailHref} className="truncate text-lg font-bold text-white hover:text-pink-200">
                {title}
              </Link>
            ) : (
              <h3 className="truncate text-lg font-bold text-white">{title}</h3>
            )}
            <p className="line-clamp-2 text-sm text-gray-400">{getPitchLine(s)}</p>
          </div>
        </div>

        {s.hackathonName && (
          <p className="text-[11px] uppercase tracking-wide text-gray-500">{s.hackathonName}</p>
        )}

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Open asks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {openAsks.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-200 ring-1 ring-pink-500/25"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <FounderAvatar name={founder} photoUrl={s.ownerPhotoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{founder}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Founder</p>
            </div>
          </div>
          {actionButton()}
        </div>
        {readOnly && (
          <p className="text-center text-xs text-gray-500 italic">Archived — team formation closed</p>
        )}
      </div>
    </article>
  );
}
