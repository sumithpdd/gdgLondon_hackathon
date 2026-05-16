"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  fetchLiveSlide,
  fetchLiveStats,
  refreshLiveStatsRemote,
  subscribeLiveStats,
  updateLiveSlide,
  type LiveSlideDoc,
  type LiveStatsSummary,
  DEFAULT_LIVE_SLIDE,
} from "@/lib/live-stats";
import { fetchVoteableProjects } from "@/lib/voting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MonitorPlay, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminLivePage() {
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slide, setSlide] = useState<LiveSlideDoc>(DEFAULT_LIVE_SLIDE);
  const [stats, setStats] = useState<LiveStatsSummary | null>(null);
  const [projectOptions, setProjectOptions] = useState<{ id: string; label: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, projs] = await Promise.all([
        fetchLiveSlide(),
        fetchLiveStats(),
        fetchVoteableProjects(),
      ]);
      setSlide(s);
      setStats(p);
      setProjectOptions(
        projs.map((x) => ({
          id: x.id,
          label: x.projectTitle || x.teamName || x.id,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.role === "admin") void load();
  }, [userProfile, load]);

  useEffect(() => {
    const unsub = subscribeLiveStats(setStats);
    return unsub;
  }, []);

  const saveSlide = async () => {
    setSaving(true);
    try {
      await updateLiveSlide(slide);
      toast({ title: "Live slide saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      await refreshLiveStatsRemote();
      toast({ title: "Live stats refreshed" });
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Refresh failed", description: err.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminShell title="Live projector" subtitle="Wall display at /live — read-only for audience">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8 max-w-2xl">
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/live" target="_blank">
                <MonitorPlay className="h-4 w-4" />
                Open projector (/live)
              </Link>
            </Button>

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Aggregates</CardTitle>
                <Button variant="outline" size="sm" onClick={() => void refreshStats()} disabled={refreshing}>
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Refresh stats</span>
                </Button>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Checked in: <strong>{stats?.checkInCount ?? 0}</strong></p>
                <p>Total votes on leaderboard: <strong>{stats?.totalVotesCast ?? 0}</strong></p>
                <p className="text-muted-foreground text-xs">
                  Stats also rebuild automatically after each vote.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slide controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mode</Label>
                  <Select
                    value={slide.mode}
                    onValueChange={(v) =>
                      setSlide((s) => ({
                        ...s,
                        mode: v as LiveSlideDoc["mode"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leaderboard">Leaderboard</SelectItem>
                      <SelectItem value="pitch">Pitch / on stage</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={slide.headline}
                    onChange={(e) => setSlide((s) => ({ ...s, headline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Subheadline</Label>
                  <Input
                    value={slide.subheadline ?? ""}
                    onChange={(e) => setSlide((s) => ({ ...s, subheadline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Show top N (leaderboard)</Label>
                  <Input
                    type="number"
                    min={3}
                    max={10}
                    value={slide.showTopN}
                    onChange={(e) =>
                      setSlide((s) => ({ ...s, showTopN: Number(e.target.value) || 5 }))
                    }
                  />
                </div>
                {slide.mode === "pitch" && (
                  <div>
                    <Label>Current pitch project</Label>
                    <Select
                      value={slide.currentPitchProjectId ?? ""}
                      onValueChange={(v) =>
                        setSlide((s) => ({ ...s, currentPitchProjectId: v || null }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={() => void saveSlide()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save slide to database
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
