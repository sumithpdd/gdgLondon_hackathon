"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/lib/AuthContext";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  castVotes,
  fetchUserVotes,
  fetchVoteableProjects,
  fetchVotingSettings,
  isUserEligibleToVote,
  voteBudgetForRole,
  VOTE_MAX_PER_PROJECT,
  type VoteableProject,
} from "@/lib/voting";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Vote } from "lucide-react";
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

  const budget = voteBudgetForRole(userProfile?.role);
  const used = useMemo(
    () => Object.values(allocations).reduce((sum, n) => sum + (n || 0), 0),
    [allocations]
  );
  const remaining = budget - used;

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
      toast({ title: "Votes saved", description: `${used} vote(s) recorded.` });
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Vote failed", description: err.message || "Failed to submit votes.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isOrganiser = userProfile?.role === "admin" || userProfile?.role === "moderator";

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Vote className="h-7 w-7 text-violet-400" />
            Vote for projects
          </h1>
          <p className="text-gray-400 text-sm">
            {HACKATHON_DISPLAY_NAME} — winners are chosen by <strong className="text-gray-200">total audience votes</strong>.
            Judging considers uniqueness, completeness, fresh ideas, and meaningful use of AI (see{" "}
            <Link href="/hackathon/resources#rules" className="text-violet-400 hover:underline">
              rules
            </Link>
            ).
          </p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6 space-y-2 text-sm text-gray-300">
            <p>
              Your budget:{" "}
              <strong className="text-white">{budget} votes</strong> ({isOrganiser ? "organiser" : "participant"}) ·
              max <strong className="text-white">{VOTE_MAX_PER_PROJECT}</strong> per project
            </p>
            <p>
              Used: <strong className="text-violet-300">{used}</strong> · Remaining:{" "}
              <strong className={remaining < 0 ? "text-rose-400" : "text-emerald-400"}>{remaining}</strong>
            </p>
            {!user && (
              <p className="text-amber-300">
                <Link href="/hackathon?login=1&redirect=/vote" className="underline text-amber-200">
                  Sign in
                </Link>{" "}
                to cast votes.
              </p>
            )}
            {user && !checkedIn && (
              <p className="text-amber-300">
                Check in at{" "}
                <Link href="/checkin" className="underline text-amber-200">
                  /checkin
                </Link>{" "}
                before voting.
              </p>
            )}
            {statusMessage && <p className="text-gray-500">{statusMessage}</p>}
            {votingOpen && user && checkedIn && (
              <Badge className="bg-emerald-600/30 text-emerald-200 border-emerald-500/40">Voting open</Badge>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No submitted projects yet.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => {
              const count = allocations[p.id] || 0;
              const isOwn = user?.uid === p.userId;
              return (
                <li key={p.id}>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-white flex justify-between gap-2">
                        <span>{p.projectTitle || p.teamName || "Untitled"}</span>
                        <Badge variant="outline" className="text-violet-300 border-violet-500/40 shrink-0">
                          {p.voteTotal ?? 0} total
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                      {isOwn ? (
                        <span className="text-sm text-gray-500">Your project — cannot vote</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="border-white/20"
                            disabled={count <= 0 || !votingOpen}
                            onClick={() => setProjectVotes(p.id, count - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-white">{count}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="border-white/20"
                            disabled={!votingOpen || count >= VOTE_MAX_PER_PROJECT || remaining <= 0}
                            onClick={() => setProjectVotes(p.id, count + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Link
                        href={`/hackathon/project/${p.id}`}
                        className="text-sm text-violet-400 hover:underline shrink-0"
                      >
                        View
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {user && (
          <Button
            className="w-full bg-violet-600 hover:bg-violet-500"
            disabled={submitting || !votingOpen || !checkedIn || used === 0 || used > budget}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit votes
          </Button>
        )}
    </div>
  );
}
