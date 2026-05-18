"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { assignWinnersFromVotes, fetchVoteableProjects } from "@/lib/voting";
import { fetchHackathonSettings, updateVotingWindow } from "@/lib/hackathon-settings";
import { Loader2, Trophy } from "lucide-react";

export default function AdminVotingPage() {
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [projects, setProjects] = useState<
    { id: string; projectTitle?: string; voteTotal?: number; place?: string | null }[]
  >([]);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [savingWindow, setSavingWindow] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projs, settings] = await Promise.all([
        fetchVoteableProjects(),
        fetchHackathonSettings(),
      ]);
      setProjects(
        projs.map((p) => ({
          id: p.id,
          projectTitle: p.projectTitle,
          voteTotal: p.voteTotal,
          place: (p as { place?: string | null }).place,
        }))
      );
      if (settings.votingOpensAt) {
        setOpensAt(settings.votingOpensAt.toISOString().slice(0, 16));
      }
      if (settings.votingClosesAt) {
        setClosesAt(settings.votingClosesAt.toISOString().slice(0, 16));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.role === "admin") void load();
  }, [userProfile, load]);

  const saveWindow = async () => {
    setSavingWindow(true);
    try {
      await updateVotingWindow({
        votingOpensAt: opensAt ? new Date(opensAt) : null,
        votingClosesAt: closesAt ? new Date(closesAt) : null,
      });
      toast({ title: "Voting window saved" });
    } catch {
      toast({ title: "Failed to save window", variant: "destructive" });
    } finally {
      setSavingWindow(false);
    }
  };

  const handleAssignFromVotes = async () => {
    setAssigning(true);
    try {
      const result = await assignWinnersFromVotes();
      toast({
        title: "Places assigned from votes",
        description: `Top project: ${result.places.first?.slice(0, 12)}…`,
      });
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Failed", description: err.message || "Could not assign.", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  return (
      <AdminShell title="Voting" subtitle="Audience vote tallies, windows, and winner assignment">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Voting window</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opens">Opens (local)</Label>
                  <Input
                    id="opens"
                    type="datetime-local"
                    value={opensAt}
                    onChange={(e) => setOpensAt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="closes">Closes (local)</Label>
                  <Input
                    id="closes"
                    type="datetime-local"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                  />
                </div>
                <Button onClick={() => void saveWindow()} disabled={savingWindow} className="sm:col-span-2">
                  {savingWindow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save voting window
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Vote leaderboard</CardTitle>
                <Button variant="secondary" onClick={() => void handleAssignFromVotes()} disabled={assigning}>
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                  Assign 1st / 2nd / 3rd from votes
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Caps: organisers (admin/moderator) 10 votes · participants 5 · max 2 per project. Enforced in
                  Cloud Function <code className="text-xs">castVotes</code>.
                </p>
                <ul className="space-y-2">
                  {projects
                    .sort((a, b) => (b.voteTotal ?? 0) - (a.voteTotal ?? 0))
                    .map((p, i) => (
                      <li
                        key={p.id}
                        className="flex justify-between items-center py-2 border-b border-border last:border-0"
                      >
                        <span>
                          <span className="text-muted-foreground w-6 inline-block">#{i + 1}</span>
                          {p.projectTitle || p.id}
                          {p.place && (
                            <span className="ml-2 text-xs uppercase text-amber-600 dark:text-amber-400">{p.place}</span>
                          )}
                        </span>
                        <strong>{p.voteTotal ?? 0}</strong>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </AdminShell>
  );
}
