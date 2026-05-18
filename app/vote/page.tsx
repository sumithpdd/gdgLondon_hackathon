"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventParticipationNotice } from "@/components/EventParticipationNotice";
import { VoteProjectCard } from "@/components/vote/VoteProjectCard";
import { useAuthContext } from "@/lib/AuthContext";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  castVotes,
  fetchUserVotes,
  fetchVoteableProjects,
  fetchVotingSettings,
  filterVoteableProjects,
  isUserEligibleToVote,
  voteBudgetForRole,
  VOTE_MAX_PER_PROJECT,
  type VoteableProject,
} from "@/lib/voting";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Search, Sparkles, Vote } from "lucide-react";

export default function VotePage() {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<VoteableProject[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [votingOpen, setVotingOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [checkedIn, setCheckedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const budget = voteBudgetForRole(userProfile?.role);
  const used = useMemo(
    () => Object.values(allocations).reduce((sum, n) => sum + (n || 0), 0),
    [allocations]
  );
  const remaining = budget - used;
  const pctUsed = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;

  const filteredProjects = useMemo(
    () => filterVoteableProjects(projects, searchQuery),
    [projects, searchQuery]
  );

  const pickedCount = useMemo(
    () => Object.values(allocations).filter((n) => n > 0).length,
    [allocations]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projs, settings] = await Promise.all([fetchVoteableProjects(), fetchVotingSettings()]);
      setProjects(projs);
      setVotingOpen(settings.votingOpen);
      setStatusMessage(settings.message);

      if (user) {
        const [votes, eligible] = await Promise.all([
          fetchUserVotes(user.uid),
          isUserEligibleToVote(user.uid),
        ]);
        setCheckedIn(eligible);
        const map: Record<string, number> = {};
        votes.forEach((v) => {
          map[v.projectId] = v.voteCount;
        });
        setAllocations(map);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Could not load voting", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const setProjectVotes = (projectId: string, next: number) => {
    const clamped = Math.max(0, Math.min(VOTE_MAX_PER_PROJECT, next));
    setAllocations((prev) => {
      const copy = { ...prev };
      if (clamped === 0) delete copy[projectId];
      else copy[projectId] = clamped;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Use the hackathon sign-in to vote.", variant: "destructive" });
      return;
    }
    if (!checkedIn) {
      toast({
        title: "Check in first",
        description: "You must check in at the event before voting.",
        variant: "destructive",
      });
      return;
    }
    if (!votingOpen) {
      toast({ title: "Voting closed", description: statusMessage || "Voting is not open.", variant: "destructive" });
      return;
    }
    if (used === 0) {
      toast({ title: "No votes selected", description: "Allocate at least one vote.", variant: "destructive" });
      return;
    }
    if (used > budget) {
      toast({ title: "Too many votes", description: `Your budget is ${budget}.`, variant: "destructive" });
      return;
    }

    const ownProject = projects.find((p) => p.userId === user.uid && (allocations[p.id] || 0) > 0);
    if (ownProject) {
      toast({ title: "Invalid ballot", description: "You cannot vote for your own project.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await castVotes(allocations);
      toast({ title: "Votes saved", description: `${used} vote(s) on ${pickedCount} project(s).` });
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Vote failed", description: err.message || "Failed to submit votes.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isOrganiser = userProfile?.role === "admin" || userProfile?.role === "moderator";
  const canSubmit = Boolean(user && checkedIn && votingOpen && used > 0 && used <= budget);

  return (
    <div className="space-y-8 pb-28">
      <header className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/80 via-[#0f0a18] to-black p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-violet-600/15 blur-2xl" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2 text-violet-300">
            <Vote className="h-8 w-8" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-violet-400/90">Audience ballot</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Vote for projects</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            {HACKATHON_DISPLAY_NAME} — pick your favourites. Up to{" "}
            <strong className="text-white">{VOTE_MAX_PER_PROJECT} votes per project</strong>. Winners by total
            audience votes.
          </p>
        </div>
      </header>

      <EventParticipationNotice compact />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Your budget</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {used}
            <span className="text-gray-500 text-lg font-normal"> / {budget}</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${pctUsed}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Remaining</p>
          <p className={cn("text-2xl font-bold tabular-nums", remaining > 0 ? "text-emerald-400" : "text-rose-400")}>
            {remaining}
          </p>
          <p className="text-xs text-gray-500 mt-1">{isOrganiser ? "Organiser ballot" : "Participant"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Status</p>
          {votingOpen && user && checkedIn ? (
            <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5" /> Open
            </p>
          ) : (
            <p className="text-amber-300 text-sm leading-snug">
              {!user ? (
                <>
                  <Link href="/hackathon?login=1&redirect=/vote" className="underline">
                    Sign in
                  </Link>
                </>
              ) : !checkedIn ? (
                <>
                  <Link href="/checkin" className="underline">
                    Check in
                  </Link>{" "}
                  first
                </>
              ) : (
                statusMessage || "Closed"
              )}
            </p>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15">
          <Sparkles className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No submitted projects to vote on yet.</p>
          <Button asChild variant="link" className="text-violet-400 mt-2">
            <Link href="/hackathon/gallery">Browse gallery</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by title, team, pitch…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 rounded-full border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 tabular-nums">
              {filteredProjects.length} / {projects.length}
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No match — try another search.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {filteredProjects.map((p) => (
                <li key={p.id}>
                  <VoteProjectCard
                    project={p}
                    count={allocations[p.id] || 0}
                    isOwn={user?.uid === p.userId}
                    votingOpen={votingOpen}
                    remaining={remaining}
                    onChange={(n) => setProjectVotes(p.id, n)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {user ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-400 min-w-0 flex-1 truncate">
              {used > 0 ? (
                <>
                  <strong className="text-white">{used}</strong> votes on{" "}
                  <strong className="text-violet-300">{pickedCount}</strong> projects
                </>
              ) : (
                "Tap + to allocate votes, then submit"
              )}
            </div>
            <Button
              className="flex-1 sm:flex-none sm:min-w-[200px] h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-900/30"
              disabled={submitting || !canSubmit}
              onClick={() => void handleSubmit()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit {used > 0 ? `${used} vote${used === 1 ? "" : "s"}` : "votes"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
