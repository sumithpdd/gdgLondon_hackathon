"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { useAuthContext } from "@/lib/AuthContext";
import {
  fetchAdminHealth,
  fetchErrorLogsFromServer,
  postTestErrorLogEntry,
} from "@/lib/error-logs-admin";
import type { AppErrorLog } from "@/types/error-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bug, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function sourceBadgeClass(source: string): string {
  if (source === "react" || source === "window") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (source === "api") return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (source === "test") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-violet-500/15 text-violet-300 border-violet-500/30";
}

export default function AdminErrorLogsPage() {
  const { user, userProfile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [q, setQ] = useState("");
  const [logs, setLogs] = useState<AppErrorLog[]>([]);
  const [meta, setMeta] = useState<{ scanned: number; returned: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [expandId, setExpandId] = useState<string | null>(null);
  const [testPosting, setTestPosting] = useState(false);
  const [healthHint, setHealthHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setLoadError(null);
    try {
      const a = new Date(from + "T00:00:00.000Z");
      const b = new Date(to + "T23:59:59.999Z");
      const res = await fetchErrorLogsFromServer(
        {
          from: a.toISOString(),
          to: b.toISOString(),
          q: q.trim() || undefined,
          limit: 400,
        },
        user
      );
      setLogs(res.logs);
      setMeta({ scanned: res.scanned, returned: res.returned });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setLoadError(msg);
      toast({ title: "Could not load error logs", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [from, to, q, toast, user]);

  useEffect(() => {
    if (!authLoading && user && userProfile?.role === "admin") {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [authLoading, user?.uid, userProfile?.role]);

  const runTestLog = async () => {
    setTestPosting(true);
    try {
      const id = await postTestErrorLogEntry(user);
      toast({
        title: "Test log written",
        description: id ? `Document id: ${id}` : "Check Firestore error_logs",
      });
      await load();
    } catch (e) {
      toast({
        title: "Test log failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTestPosting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminShell
        title="Error logs"
        subtitle="Client, React, and API failures in Firestore error_logs (mobile-friendly)"
      >
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-amber-500/40 text-amber-200"
              disabled={testPosting || busy}
              onClick={() => void runTestLog()}
            >
              {testPosting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bug className="h-4 w-4 mr-2" />
              )}
              Test log
            </Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => void load()}>
              <RefreshCw className={cn("h-4 w-4 mr-2", busy && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <Card className="border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-date">From</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="min-h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date">To</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="min-h-11 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-q">Search message / path / stack</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. permission, deleteArchivedProject"
                    className="min-h-11 pl-9 text-base"
                  />
                </div>
              </div>
              <Button type="button" className="w-full sm:w-auto min-h-11" onClick={() => void load()}>
                Apply filters
              </Button>
            </CardContent>
          </Card>

          {loadError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive border border-destructive/30 rounded-xl px-4 py-3">
                {loadError}
              </p>
              {healthHint ? (
                <p className="text-sm text-amber-200/90 border border-amber-500/30 rounded-xl px-4 py-3 leading-relaxed">
                  {healthHint}
                </p>
              ) : null}
            </div>
          ) : null}

          {meta ? (
            <p className="text-sm text-muted-foreground">
              Scanned {meta.scanned} document(s) · showing {meta.returned} in range
            </p>
          ) : null}

          {busy && logs.length === 0 ? (
            <p className="text-center py-16 text-muted-foreground">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl px-4">
              No errors in this range. Use Test log once to create the collection, or widen the dates.
            </p>
          ) : (
            <ul className="space-y-3">
              {logs.map((r) => {
                const expanded = expandId === r.id;
                return (
                  <li key={r.id}>
                    <Card className="border-border overflow-hidden">
                      <button
                        type="button"
                        className="w-full text-left p-4 sm:p-5 space-y-3 min-h-[44px]"
                        onClick={() => setExpandId(expanded ? null : r.id)}
                      >
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <Badge variant="outline" className={cn("text-xs", sourceBadgeClass(r.source))}>
                            {r.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatLogTime(r.createdAt)}</span>
                        </div>
                        <p className="text-base font-medium text-foreground leading-snug break-words">
                          {r.message}
                        </p>
                        {r.path ? (
                          <p className="text-sm text-muted-foreground break-all">{r.path}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {r.userEmail || r.userId || "Anonymous"} · tap for {expanded ? "less" : "details"}
                        </p>
                      </button>
                      {expanded ? (
                        <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-border space-y-3 text-sm">
                          {r.url ? (
                            <p className="text-muted-foreground break-all">
                              <span className="text-foreground/70">URL: </span>
                              {r.url}
                            </p>
                          ) : null}
                          {r.userAgent ? (
                            <p className="text-muted-foreground break-all text-xs leading-relaxed">
                              {r.userAgent}
                            </p>
                          ) : null}
                          {r.stack ? (
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-72 overflow-y-auto rounded-xl bg-muted/50 p-3 border border-border">
                              {r.stack}
                            </pre>
                          ) : (
                            <p className="text-muted-foreground italic">No stack trace</p>
                          )}
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-muted-foreground flex gap-2 items-start leading-relaxed pb-8">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            Writes go through the API only (not from the browser SDK). Set Firebase Admin env vars on Vercel
            for production logging.
          </p>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
