"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  fetchHackathonContent,
  updateHackathonContent,
  seedDefaultHackathonContent,
  type ContentLink,
  type RulesSection,
} from "@/lib/hackathon-content";
import { DEFAULT_HACKATHON_CONTENT } from "@/lib/hackathon-content-defaults";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminContentPage() {
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resourcesIntro, setResourcesIntro] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [rulesTitle, setRulesTitle] = useState("");
  const [links, setLinks] = useState<ContentLink[]>([]);
  const [sections, setSections] = useState<RulesSection[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchHackathonContent();
      setResourcesIntro(c.resourcesIntro);
      setDiscordUrl(c.discordUrl);
      setRulesTitle(c.rulesTitle);
      setLinks(c.resourceLinks);
      setSections(c.rulesSections);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.role === "admin") void load();
  }, [userProfile, load]);

  const save = async () => {
    setSaving(true);
    try {
      await updateHackathonContent({
        resourcesIntro,
        discordUrl,
        rulesTitle,
        resourceLinks: links.filter((l) => l.href && l.label),
        rulesSections: sections,
      });
      toast({ title: "Content saved", description: "Resources and rules updated in Firestore." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    setSaving(true);
    try {
      await seedDefaultHackathonContent();
      await load();
      toast({ title: "Defaults seeded", description: "Merged default resources & rules into settings/main." });
    } catch {
      toast({ title: "Seed failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (index: number, patch: Partial<RulesSection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminShell
        title="Content"
        subtitle="Per-hackathon resources links and rules (stored in settings/main)"
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void seedDefaults()} disabled={saving}>
                Seed defaults to database
              </Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save all
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Intro text</Label>
                  <Textarea
                    value={resourcesIntro}
                    onChange={(e) => setResourcesIntro(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Discord URL</Label>
                  <Input value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} />
                </div>
                <Label>Learning links</Label>
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => {
                          const next = [...links];
                          next[i] = { ...next[i], label: e.target.value };
                          setLinks(next);
                        }}
                      />
                      <Input
                        placeholder="https://"
                        value={link.href}
                        onChange={(e) => {
                          const next = [...links];
                          next[i] = { ...next[i], href: e.target.value };
                          setLinks(next);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinks([...links, { label: "", href: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rules sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Rules page title</Label>
                  <Input value={rulesTitle} onChange={(e) => setRulesTitle(e.target.value)} />
                </div>
                {sections.map((section, i) => (
                  <div key={section.id} className="p-4 rounded-lg border border-border space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-sm text-muted-foreground">
                        #{section.sortOrder} · {section.id}
                      </span>
                      <Select
                        value={section.kind}
                        onValueChange={(v) =>
                          updateSection(i, { kind: v as RulesSection["kind"] })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">card</SelectItem>
                          <SelectItem value="warning">warning</SelectItem>
                          <SelectItem value="numbered">numbered</SelectItem>
                          <SelectItem value="judging">judging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      placeholder="Title"
                    />
                    <Textarea
                      value={section.body ?? ""}
                      onChange={(e) => updateSection(i, { body: e.target.value })}
                      placeholder="Body (use blank lines between paragraphs)"
                      rows={3}
                    />
                    <Textarea
                      value={(section.items ?? []).join("\n")}
                      onChange={(e) =>
                        updateSection(i, {
                          items: e.target.value.split("\n").filter(Boolean),
                        })
                      }
                      placeholder="List items (one per line)"
                      rows={3}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Judging criteria list is edited separately via settings{" "}
                  <code className="text-xs">judgingCriteria</code> (seed script) or extend this UI later.
                </p>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Public pages:{" "}
              <a href="/hackathon/resources" className="text-primary underline" target="_blank" rel="noreferrer">
                /hackathon/resources
              </a>
              . Defaults preview: {DEFAULT_HACKATHON_CONTENT.rulesSections.length} rule sections.
            </p>
          </div>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
