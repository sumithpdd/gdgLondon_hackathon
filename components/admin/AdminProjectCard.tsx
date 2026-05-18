"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Github,
  Mail,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { useState } from "react";
import type { Submission } from "@/types/submission";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import {
  adminProjectStatusLabel,
  adminProjectTypeLabel,
} from "@/lib/admin-projects-list";
import { AI_CATEGORY_LABELS } from "@/lib/idea-gallery";
import { AdminScreenshotGallery } from "@/components/admin/AdminScreenshotGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLocaleDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4 py-2 border-b border-border/60 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground min-w-0 break-words">{children}</dd>
    </div>
  );
}

function statusBadgeClass(status?: Submission["status"]) {
  switch (status) {
    case "submitted":
      return "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "draft":
      return "bg-amber-600/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

type Props = {
  project: Submission;
  onPlaceChange: (projectId: string, place: string) => void;
  onDelete: (projectId: string) => void;
  defaultExpanded?: boolean;
};

export function AdminProjectCard({
  project,
  onPlaceChange,
  onDelete,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const title = getProjectTitle(project);
  const team = getTeamName(project);
  const screenshots = project.screenshots ?? [];
  const statusLabel = adminProjectStatusLabel(project.status);
  const typeLabel = adminProjectTypeLabel(project.projectType);

  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          className="w-full flex items-start justify-between gap-4 p-4 sm:p-5 text-left hover:bg-muted/40 transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
              <Badge variant="outline" className={cn("shrink-0", statusBadgeClass(project.status))}>
                {statusLabel}
              </Badge>
              {project.place ? (
                <Badge className="shrink-0 bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40">
                  {project.place}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {team} · {typeLabel}
              {project.createdAt
                ? ` · ${formatLocaleDateTime(project.createdAt)}`
                : null}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
          )}
        </button>

        {expanded ? (
          <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-border space-y-6">
            <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-6">
              <AdminScreenshotGallery screenshots={screenshots} />
              <dl className="space-y-0">
                <DetailRow label="Title">{title}</DetailRow>
                <DetailRow label="Team name">{team}</DetailRow>
                <DetailRow label="Type">{typeLabel}</DetailRow>
                <DetailRow label="Status">{statusLabel}</DetailRow>
                <DetailRow label="App purpose">
                  <p className="whitespace-pre-wrap">{project.appPurpose?.trim() || "—"}</p>
                </DetailRow>
                <DetailRow label="Demo video">
                  {project.demoVideoUrl?.trim() ? (
                    <a
                      href={project.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline break-all"
                    >
                      <Video className="h-4 w-4 shrink-0" />
                      {project.demoVideoUrl}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </DetailRow>
                <DetailRow label="GitHub">
                  {project.githubUrl?.trim() ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline break-all"
                    >
                      <Github className="h-4 w-4 shrink-0" />
                      {project.githubUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </DetailRow>
                {project.aiCategory ? (
                  <DetailRow label="AI category">
                    {AI_CATEGORY_LABELS[project.aiCategory] ?? project.aiCategory}
                  </DetailRow>
                ) : null}
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <DetailRow label="Team members">
                    <ul className="space-y-1">
                      {project.teamMembers.map((m, i) => (
                        <li key={`${m.name}-${i}`}>
                          {m.name}
                          {m.linkedinUrl ? (
                            <>
                              {" "}
                              <a
                                href={m.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-600 dark:text-violet-400 hover:underline"
                              >
                                LinkedIn
                              </a>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </DetailRow>
                ) : null}
                <DetailRow label="Owner">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {project.fullName || project.email || project.userId}
                  </span>
                </DetailRow>
                <DetailRow label="Email">
                  <a
                    href={`mailto:${project.userEmail || project.email}`}
                    className="inline-flex items-center gap-1.5 hover:underline break-all"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {project.userEmail || project.email || "—"}
                  </a>
                </DetailRow>
                <DetailRow label="Project ID">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{project.id}</code>
                </DetailRow>
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-border">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Winner place</label>
                <Select
                  value={project.place || "none"}
                  onValueChange={(value) => project.id && onPlaceChange(project.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No place</SelectItem>
                    <SelectItem value="first">First place</SelectItem>
                    <SelectItem value="second">Second place</SelectItem>
                    <SelectItem value="third">Third place</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                {project.id ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/hackathon/project/${project.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Public page
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => project.id && onDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
