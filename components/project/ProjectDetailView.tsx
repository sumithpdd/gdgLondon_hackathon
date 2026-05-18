"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Github,
  Linkedin,
  ExternalLink,
  Share2,
  Bookmark,
  Eye,
  UserPlus,
  Loader2,
  Globe,
} from "lucide-react";
import { Submission } from "@/types/submission";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import {
  getPitchLine,
  getOpenAsks,
  getFounderName,
  getProjectStage,
  getCategoryLabel,
  PROJECT_STAGE_LABELS,
} from "@/lib/idea-gallery";
import {
  parseAppPurpose,
  getExternalSiteLabel,
  getProjectMetaLine,
  getTractionSummary,
} from "@/lib/project-detail";
import { Button } from "@/components/ui/button";
import { formatLocaleDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/app/hackathon/project/[id]/CommentSection";

function getYouTubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v") || u.pathname.split("/").pop();
    return v ? `https://www.youtube.com/embed/${v}` : url;
  } catch {
    return url;
  }
}

function FounderAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-10 w-10" : "h-14 w-14";
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={size === "sm" ? 40 : 56}
        height={size === "sm" ? 40 : 56}
        className={cn(dim, "rounded-full object-cover ring-2 ring-white/10")}
      />
    );
  }
  return (
    <span
      className={cn(
        dim,
        "flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 font-bold text-white ring-2 ring-white/10",
        size === "sm" ? "text-sm" : "text-lg"
      )}
    >
      {(name[0] || "?").toUpperCase()}
    </span>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-5 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

type Props = {
  submission: Submission;
  backHref: string;
  backLabel: string;
  isOwner?: boolean;
  isAuthenticated?: boolean;
  userHasProject?: boolean;
  profileComplete?: boolean;
  hasRequested?: boolean;
  isRequesting?: boolean;
  isBookmarked?: boolean;
  bookmarkLoading?: boolean;
  onShare: () => void;
  onToggleBookmark?: () => void;
  onRequestJoin?: () => void;
  onSignIn?: () => void;
};

export function ProjectDetailView({
  submission: s,
  backHref,
  backLabel,
  isOwner = false,
  isAuthenticated = false,
  userHasProject = false,
  profileComplete = true,
  hasRequested = false,
  isRequesting = false,
  isBookmarked = false,
  bookmarkLoading = false,
  onShare,
  onToggleBookmark,
  onRequestJoin,
  onSignIn,
}: Props) {
  const [tab, setTab] = useState<"overview" | "discussion">("overview");
  const title = getProjectTitle(s);
  const founder = getFounderName(s);
  const openAsks = getOpenAsks(s);
  const { about, problem, solution } = parseAppPurpose(s.appPurpose || "");
  const metaLine = getProjectMetaLine(s);
  const traction = getTractionSummary(s);
  const siteLabel = getExternalSiteLabel(s);
  const banner = s.screenshots?.[0];
  const stage = PROJECT_STAGE_LABELS[getProjectStage(s)];
  const recruiting = s.lookingForMembers === true;

  const labelRibbon =
    s.place === "first" || s.place === "second" || s.place === "third"
      ? { text: "WINNER", className: "bg-amber-500 text-white" }
      : s.label === "finalist"
        ? { text: "FINALIST", className: "bg-slate-600 text-white" }
        : s.label === "featured"
          ? { text: "FEATURED", className: "bg-blue-600 text-white" }
          : null;

  const renderGetInvolved = () => {
    if (!recruiting) return null;
    if (isOwner) {
      return (
        <Button asChild className="bg-pink-600 hover:bg-pink-500 font-semibold">
          <Link href={`/hackathon/my-projects?project=1&edit=${s.id}`}>Edit project</Link>
        </Button>
      );
    }
    if (!isAuthenticated) {
      return (
        <Button className="bg-pink-600 hover:bg-pink-500 font-semibold" onClick={onSignIn}>
          Get involved
        </Button>
      );
    }
    if (userHasProject) {
      return (
        <Button disabled className="bg-white/10 text-gray-400">
          Already in a project
        </Button>
      );
    }
    if (!profileComplete) {
      return (
        <Button asChild variant="outline" className="border-amber-500/50 text-amber-200">
          <Link href="/hackathon/profile">Complete profile to join</Link>
        </Button>
      );
    }
    if (hasRequested) {
      return (
        <Button disabled className="bg-white/10 text-gray-400">
          Request sent
        </Button>
      );
    }
    return (
      <Button
        className="bg-pink-600 hover:bg-pink-500 font-semibold gap-2"
        onClick={onRequestJoin}
        disabled={isRequesting}
      >
        {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Get involved
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <Link href={backHref} className="inline-flex text-sm text-gray-400 hover:text-white transition-colors">
        ← {backLabel}
      </Link>

      {/* Hero */}
      <header className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative shrink-0">
            {banner ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-2 ring-white/10 md:h-28 md:w-28">
                <Image src={banner} alt="" fill className="object-cover" sizes="112px" />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 text-3xl font-bold text-white ring-2 ring-white/10 md:h-28 md:w-28">
                {title[0]?.toUpperCase() || "?"}
              </div>
            )}
            {labelRibbon && (
              <span
                className={cn(
                  "absolute -top-2 -right-2 rounded px-2 py-0.5 text-[10px] font-bold",
                  labelRibbon.className
                )}
              >
                {labelRibbon.text}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="text-lg text-gray-300">{getPitchLine(s, 200)}</p>
            {about && (
              <p className="text-sm text-gray-500 line-clamp-3 md:line-clamp-none">{about.slice(0, 280)}{about.length > 280 ? "…" : ""}</p>
            )}
            {!about && s.appPurpose && (
              <p className="text-sm text-gray-500 line-clamp-3">{s.appPurpose.slice(0, 280)}…</p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {renderGetInvolved()}
              {isAuthenticated && onToggleBookmark && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-gray-200 hover:bg-white/10 gap-1.5"
                  onClick={onToggleBookmark}
                  disabled={bookmarkLoading}
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-pink-400 text-pink-400")} />
                  {isBookmarked ? "Saved" : "Save project"}
                </Button>
              )}
              {s.githubUrl && (
                <Button variant="outline" size="sm" className="border-white/20 text-gray-200 hover:bg-white/10" asChild>
                  <a href={s.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-1.5" />
                    Code
                  </a>
                </Button>
              )}
              {s.websiteUrl && (
                <Button variant="outline" size="sm" className="border-white/20 text-gray-200 hover:bg-white/10" asChild>
                  <a
                    href={s.websiteUrl.startsWith("http") ? s.websiteUrl : `https://${s.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4 mr-1.5" />
                    {siteLabel || "Website"}
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 text-gray-200 hover:bg-white/10 h-9 w-9"
                onClick={onShare}
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold uppercase tracking-wide text-emerald-300">
                {stage}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-pink-300/90">{getCategoryLabel(s)}</span>
              {metaLine.includes("·") && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>{openAsks.join(", ")}</span>
                </>
              )}
              <span className="text-gray-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {s.views ?? 0} views
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <div className="flex gap-6 border-b border-white/10">
            {(["overview", "discussion"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "pb-3 text-xs font-semibold uppercase tracking-widest transition-colors",
                  tab === t ? "text-white border-b-2 border-pink-500 -mb-px" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {t === "overview" ? "Overview" : "Discussion"}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">About</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {about || s.appPurpose || "No description yet."}
                </p>
              </section>

              {(problem || solution) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {problem && (
                    <div className="rounded-xl border border-pink-500/20 bg-pink-500/[0.06] p-5">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-400">
                        The problem
                      </h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{problem}</p>
                    </div>
                  )}
                  {solution && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                        The solution
                      </h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{solution}</p>
                    </div>
                  )}
                </div>
              )}

              {s.demoVideoUrl && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Demo</h2>
                  <div className="aspect-video overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
                    <iframe
                      src={getYouTubeEmbedUrl(s.demoVideoUrl)}
                      title="Demo video"
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {s.screenshots && s.screenshots.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Screenshots</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {s.screenshots.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-video overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10"
                      >
                        <Image src={url} alt={`Screenshot ${i + 1}`} fill className="object-cover" sizes="200px" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(s.teamMembers?.length ?? 0) > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Team</h2>
                  <p className="text-sm text-gray-500 mb-3">{getTeamName(s)}</p>
                  <ul className="space-y-2">
                    {s.teamMembers!.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <span className="font-medium text-gray-200">{m.name}</span>
                        {m.linkedinUrl && (
                          <a
                            href={m.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-400 hover:text-pink-300"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {s.createdAt && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Timeline</h2>
                  <ol className="relative border-l border-white/15 pl-6 space-y-4">
                    <li>
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-pink-500 ring-4 ring-[#0a0a0f]" />
                      <p className="text-xs text-gray-500">
                        {formatLocaleDate(s.createdAt, {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-300">Project listed on hackathon hub</p>
                    </li>
                    {s.status === "submitted" && (
                      <li>
                        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-[#0a0a0f]" />
                        <p className="text-sm text-gray-300">Final submission completed</p>
                      </li>
                    )}
                  </ol>
                </section>
              )}
            </div>
          ) : (
            <CommentSection projectId={s.id!} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {recruiting && openAsks.length > 0 && (
            <SidebarCard title="Looking for">
              <div className="flex flex-wrap gap-2">
                {openAsks.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-2">{renderGetInvolved()}</div>
            </SidebarCard>
          )}

          <SidebarCard title="Founder">
            <div className="flex items-center gap-3">
              <FounderAvatar name={founder} photoUrl={s.ownerPhotoUrl} />
              <div>
                <p className="font-semibold text-white">{founder}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">Founder</p>
                {s.linkedinUrl && (
                  <a
                    href={s.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
                  >
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">{s.projectType === "team" ? "Team project" : "Solo — may be seeking co-builders"}</p>
          </SidebarCard>

          {traction && (
            <SidebarCard title="Traction">
              <p className="text-sm text-gray-300 leading-relaxed">{traction}</p>
            </SidebarCard>
          )}

          {s.hackathonName && (
            <SidebarCard title="Event">
              <p className="text-sm font-medium text-white">{s.hackathonName}</p>
              {recruiting && (
                <Link href="/hackathon/ideas" className="text-xs text-pink-400 hover:text-pink-300">
                  Browse idea gallery →
                </Link>
              )}
            </SidebarCard>
          )}

          {(s.builtWith?.length ?? 0) > 0 && (
            <SidebarCard title="Built with">
              <div className="flex flex-wrap gap-2">
                {s.builtWith!.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-300 ring-1 ring-white/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </SidebarCard>
          )}

          {s.githubUrl && (
            <SidebarCard title="Links">
              <a
                href={s.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 break-all"
              >
                <Github className="h-4 w-4 shrink-0" />
                Repository
                <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
              </a>
            </SidebarCard>
          )}
        </aside>
      </div>
    </div>
  );
}
