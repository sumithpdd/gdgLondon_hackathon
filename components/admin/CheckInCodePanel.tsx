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
  fetchCheckInDeskCode,
  fetchCheckInPublicConfig,
  formatCheckInCodeDisplay,
  formatCheckInWindow,
  generateCheckInCode,
  persistOrganiserCheckInCode,
  readOrganiserCheckInCodeSession,
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
  const [codeGeneratedAt, setCodeGeneratedAt] = useState<Date | null>(null);
  const [windowLabel, setWindowLabel] = useState("");

  const applyCode = useCallback((raw: string | null | undefined, generatedAt?: Date) => {
    if (!raw) return;
    const normalized = raw.replace(/\s/g, "");
    if (normalized.length === 6) {
      setDisplayCode(formatCheckInCodeDisplay(normalized));
      if (generatedAt) setCodeGeneratedAt(generatedAt);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, desk] = await Promise.all([fetchCheckInPublicConfig(), fetchCheckInDeskCode()]);
      setEnabled(cfg.selfCheckInEnabled);
      setOpensAt(cfg.windowOpensAt ? cfg.windowOpensAt.toISOString().slice(0, 16) : "");
      setClosesAt(cfg.windowClosesAt ? cfg.windowClosesAt.toISOString().slice(0, 16) : "");
      setWindowLabel(formatCheckInWindow(cfg));

      if (desk.code) {
        applyCode(desk.code, desk.generatedAt);
        persistOrganiserCheckInCode(desk.code);
      } else {
        const sessionCode = readOrganiserCheckInCodeSession();
        if (sessionCode) applyCode(sessionCode);
      }
    } catch {
      toast({ title: "Could not load check-in settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, applyCode]);

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
      persistOrganiserCheckInCode(code);
      applyCode(code, new Date());
      toast({
        title: "New code generated",
        description: "Displayed below — previous codes stop working.",
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
          Attendees enter this 6-digit code on{" "}
          <span className="text-gray-300">/checkin</span> during the window. Regenerating replaces the active code;
          the current code stays visible here for the desk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {displayCode ? (
          <div className="rounded-xl border-2 border-cyan-500/45 bg-gradient-to-b from-cyan-950/60 to-black/40 px-4 py-6 text-center shadow-lg shadow-cyan-900/20">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-300/90 mb-3">
              Room code — share with attendees
            </p>
            <p className="font-mono text-4xl sm:text-5xl font-bold tracking-[0.35em] text-white tabular-nums">
              {displayCode}
            </p>
            {codeGeneratedAt ? (
              <p className="mt-3 text-xs text-gray-500">
                Generated{" "}
                {codeGeneratedAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-4 border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
              onClick={() => void copyCode()}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy code
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center text-sm text-gray-500">
            No active code — generate one below for self check-in.
          </div>
        )}

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
          <Label className="text-xs uppercase tracking-wide text-gray-500">Regenerate code</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              readOnly
              value={displayCode}
              placeholder="Generate a code"
              className={`${fieldClass} font-mono text-lg tracking-[0.25em] text-center sm:flex-1`}
            />
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
                  Generate new code
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
