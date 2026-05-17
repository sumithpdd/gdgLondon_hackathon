"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { listHackathons, createHackathon, type HackathonRegistryRecord } from "@/lib/hackathons-registry";
import { ensureActiveHackathonRegistry, getActiveHackathonId } from "@/lib/active-hackathon";
import { BUILD_WITH_AI_EVENT_DESCRIPTION } from "@/lib/constants";
import { DEFAULT_IO2026_PRIZES } from "@/lib/prizes";
import { db } from "@/lib/firebase";
import { SETTINGS_COLLECTION, SETTINGS_DOC_ID } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2 } from "lucide-react";

export default function AdminHackathonsPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [rows, setRows] = useState<HackathonRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedingPrizes, setSeedingPrizes] = useState(false);
  const [seedingEvent, setSeedingEvent] = useState(false);
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [dataKey, setDataKey] = useState<"io2026" | "legacy">("io2026");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listHackathons());
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not load hackathons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    setId(getActiveHackathonId());
    setDescription(BUILD_WITH_AI_EVENT_DESCRIPTION);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanId = id.trim().replace(/\s+/g, "-");
    if (!cleanId || !displayName.trim()) {
      toast({
        title: "Missing fields",
        description: "Document id and display name are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await createHackathon({
        id: cleanId,
        slug: slug.trim() || cleanId,
        displayName: displayName.trim(),
        description: description.trim(),
        dataCollectionKey: dataKey,
        createdBy: user.uid,
      });
      toast({ title: "Saved", description: `Hackathon “${cleanId}” created or updated.` });
      setId("");
      setSlug("");
      setDisplayName("");
      setDescription("");
      await load();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Create failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedPrizes = async () => {
    if (!user) return;
    setSeedingPrizes(true);
    try {
      await setDoc(
        doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
        {
          prizes: DEFAULT_IO2026_PRIZES,
          prizesUpdatedAt: new Date(),
          prizesUpdatedBy: user.uid,
        },
        { merge: true }
      );
      toast({
        title: "Prize pool updated",
        description:
          "IO 2026 physical prizes written to settings (Sony headphones, keyboard, bag, socks).",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not write prizes",
        variant: "destructive",
      });
    } finally {
      setSeedingPrizes(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminShell
        title="Hackathons"
        subtitle="Register hackathon editions for the platform. User participation is tracked per id (see env NEXT_PUBLIC_ACTIVE_HACKATHON_ID, default io2026Hackathon). Firestore project/user data still follows NEXT_PUBLIC_HACKATHON_DATASET."
      >
        <div className="space-y-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Active participation id
              </CardTitle>
              <CardDescription>
                Signed-in users get a{" "}
                <code className="text-xs bg-muted px-1 rounded">hackathonParticipations</code> entry under this id:{" "}
                <strong className="text-foreground">{getActiveHackathonId()}</strong>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Active event (home page copy)</CardTitle>
              <CardDescription>
                Writes the Build with AI description to{" "}
                <code className="text-xs bg-muted px-1 rounded">hackathons/{getActiveHackathonId()}</code> for the hub
                hero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="secondary"
                disabled={seedingEvent || !user}
                onClick={async () => {
                  if (!user) return;
                  setSeedingEvent(true);
                  try {
                    await ensureActiveHackathonRegistry(user.uid);
                    toast({ title: "Saved", description: "Active hackathon event doc updated." });
                    await load();
                  } catch (e) {
                    console.error(e);
                    toast({ title: "Error", description: "Could not save event doc.", variant: "destructive" });
                  } finally {
                    setSeedingEvent(false);
                  }
                }}
              >
                {seedingEvent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Seed active event description"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">IO 2026 prize pool (Firestore)</CardTitle>
              <CardDescription>
                Writes the four in-person prizes into{" "}
                <code className="text-xs bg-muted px-1 rounded">settings/main</code> so the carousel and prizes page load
                from the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void handleSeedPrizes()} disabled={seedingPrizes} variant="secondary">
                {seedingPrizes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Writing…
                  </>
                ) : (
                  "Seed IO 2026 prizes to settings"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Create or update registry entry</CardTitle>
              <CardDescription>
                Use a stable document id (e.g.{" "}
                <code className="text-xs bg-muted px-1">io2026Hackathon</code>).{" "}
                <code className="text-xs bg-muted px-1">dataCollectionKey</code> documents which dataset this edition is
                associated with; it does not switch the app — that remains{" "}
                <code className="text-xs bg-muted px-1">NEXT_PUBLIC_HACKATHON_DATASET</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="hid">Document id</Label>
                  <Input
                    id="hid"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="io2026Hackathon"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="io2026-hackathon" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dname">Display name</Label>
                  <Input
                    id="dname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="IO 2026 Hackathon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Data collection key</Label>
                  <Select value={dataKey} onValueChange={(v) => setDataKey(v as "io2026" | "legacy")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="io2026">io2026 (io2026Hackathon_* collections)</SelectItem>
                      <SelectItem value="legacy">legacy (hackaton*)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save hackathon"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Registry</CardTitle>
              <CardDescription>{loading ? "Loading…" : `${rows.length} hackathon(s)`}</CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents in `hackathons` yet.</p>
              ) : (
                <ul className="space-y-3">
                  {rows.map((r) => (
                    <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-semibold text-foreground">{r.displayName}</p>
                      <p className="text-muted-foreground font-mono text-xs mt-1">
                        id: {r.id} · slug: {r.slug} · data: {r.dataCollectionKey}
                      </p>
                      {r.description ? <p className="text-muted-foreground mt-2">{r.description}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground mt-6">
                Use the buttons above to seed prizes and registry metadata, or edit settings in{" "}
                <Link href="/admin/content" className="text-violet-600 dark:text-violet-400 underline">
                  Content
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <div>
            <Link href="/admin">
              <Button type="button" variant="outline" size="sm">
                ← Back to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
