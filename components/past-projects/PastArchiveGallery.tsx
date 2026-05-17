"use client";

import { useMemo, useState } from "react";
import { Search, Lightbulb, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type ArchivedProject,
  matchesArchiveSearch,
  isLowQualityArchiveProject,
} from "@/lib/archived-hackathon";
import { isArchivedIdeaProject as isIdea } from "@/lib/hackathon-projects";
import { PastArchiveProjectCard } from "./PastArchiveProjectCard";
import { cn } from "@/lib/utils";

type Filter = "all" | "ideas" | "submissions" | "review";

type Props = {
  projects: ArchivedProject[];
  isAdmin?: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
};

export function PastArchiveGallery({ projects, isAdmin, deletingId, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = projects.filter((p) => matchesArchiveSearch(p, search));
    if (filter === "ideas") {
      list = list.filter((p) => isIdea(p));
    } else if (filter === "submissions") {
      list = list.filter((p) => !isIdea(p));
    } else if (filter === "review") {
      list = list.filter((p) => isLowQualityArchiveProject(p));
    }
    return list;
  }, [projects, search, filter]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      ideas: projects.filter((p) => isIdea(p)).length,
      submissions: projects.filter((p) => !isIdea(p)).length,
      review: projects.filter((p) => isLowQualityArchiveProject(p)).length,
    }),
    [projects]
  );

  const filters: { id: Filter; label: string; icon?: typeof Lightbulb }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "ideas", label: `Past ideas (${counts.ideas})`, icon: Lightbulb },
    { id: "submissions", label: `Submissions (${counts.submissions})` },
    { id: "review", label: `Review (${counts.review})` },
  ];

  return (
    <section
      id="archive-gallery"
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#0f0a18]/50 p-6 sm:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-pink-400" />
            Archive gallery
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Past idea gallery and all IWD 2026 submissions in one place.
            {isAdmin ? " Admins can delete test or untitled entries." : ""}
          </p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search title, team, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            className={cn(
              "rounded-full",
              filter === f.id
                ? "bg-pink-600 hover:bg-pink-500 text-white border-0"
                : "border-white/15 text-gray-300 hover:bg-white/10"
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.icon ? <f.icon className="h-3.5 w-3.5 mr-1.5" /> : null}
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No projects match this filter.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PastArchiveProjectCard
              key={p.id}
              project={p}
              showIdeaBadge={isIdea(p)}
              isAdmin={isAdmin}
              isDeleting={deletingId === p.id}
              onDelete={() => onDelete(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
