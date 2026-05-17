"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Key, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  callableCheckInError,
  fetchCheckInPublicConfig,
  formatCheckInCodeDisplay,
  formatCheckInWindow,
  generateCheckInCode,
  updateCheckInPublicConfig,
} from "@/lib/check-in";

const fieldClass =
  "bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500/50";

export function CheckInCodePanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [windowLabel, setWindowLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchCheckInPublicConfig();
      setEnabled(cfg.selfCheckInEnabled);
      setOpensAt(cfg.windowOpensAt ? cfg.windowOpensAt.toISOString().slice(0, 16) : "");
      setClosesAt(cfg.windowClosesAt ? cfg.windowClosesAt.toISOString().slice(0, 16) : "");
      setWindowLabel(formatCheckInWindow(cfg));
    } catch {
      toast({ title: "Could not load check-in settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await updateCheckInPublicConfig({
        selfCheckInEnabled: enabled,
        windowOpensAt: opensAt ? new Date(opensAt) : null,
        windowClosesAt: closesAt ? new Date(closesAt) : null,
      });
      toast({ title: "Check-in settings saved" });
      await load();
    } catch (e) {
      toast({
        title: "Save failed",
        description: callableCheckInError(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { code } = await generateCheckInCode();
      setDisplayCode(formatCheckInCodeDisplay(code));
      toast({
        title: "New code generated",
        description: "Share it with attendees during the window. Previous codes stop working.",
      });
    } catch (e) {
      toast({
        title: "Could not generate code",
        description: callableCheckInError(e),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    const raw = displayCode.replace(/\s/g, "");
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      toast({ title: "Code copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card className="border-cyan-500/20 bg-[#0f0a18]/90">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/25 bg-[#0f0a18]/90">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 font-mono text-lg">
          <Key className="h-5 w-5 text-cyan-400" />
          Live attendance code
        </CardTitle>
        <CardDescription className="text-gray-400">
          Attendees signed into the app enter this 6-digit code on{" "}
          <span className="text-gray-300">/checkin</span> during the window below. The code is stored as a
          hash on the server — not visible in the public settings document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex items-center gap-3 text-gray-200 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-white/30 bg-black/30 text-cyan-600 focus:ring-cyan-500/50"
          />
          Enable self check-in for this event
        </label>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-gray-500">6-digit code</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                readOnly
                value={displayCode}
                placeholder="Generate a code"
                className={`${fieldClass} font-mono text-xl tracking-[0.35em] text-center`}
              />
              {displayCode ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => void copyCode()}
                  aria-label="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-gray-500">Window opens (local)</Label>
            <Input
              type="datetime-local"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-gray-500">Window closes (local)</Label>
            <Input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">Current window: {windowLabel}</p>

        <Button
          type="button"
          onClick={() => void saveConfig()}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save check-in settings
        </Button>
      </CardContent>
    </Card>
  );
}
