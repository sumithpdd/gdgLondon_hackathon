"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logClientError } from "@/lib/clientErrorLogger";
import {
  fetchEventCheckInStatus,
  postEventSelfCheckIn,
  type EventCheckInStatusResult,
} from "@/lib/meApi";
import { normalizeCheckInCodeInput } from "@/lib/check-in";
import { cn } from "@/lib/utils";

type Props = {
  userId: string | undefined;
  /** When true, loads status from API (expanded card on /checkin). */
  expanded?: boolean;
  onCheckedIn?: () => void;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function SelfCheckInCard({ userId, expanded = true, onCheckedIn }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<EventCheckInStatusResult | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !expanded) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await fetchEventCheckInStatus();
      setStatus(s);
    } catch (e) {
      logClientError(e, "report");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [userId, expanded]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const normalized = normalizeCheckInCodeInput(code);
    if (normalized.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await postEventSelfCheckIn(normalized);
      toast({
        title: result.alreadyMarked ? "Already checked in" : "You’re checked in",
        description: "Attendance recorded for this event.",
      });
      setCode("");
      await refresh();
      onCheckedIn?.();
    } catch (err) {
      logClientError(err, "report");
      toast({
        title: "Check-in failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121a] px-5 py-6 text-sm text-gray-400">
        Sign in to use self check-in.
      </div>
    );
  }

  if (!expanded) return null;

  if (loading || !status) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121a] px-5 py-6 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        Checking live check-in…
      </div>
    );
  }

  if (!status.eligible) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121a] px-5 py-6 text-sm text-gray-400">
        Your account is not eligible for self check-in.
      </div>
    );
  }

  if (status.checkedIn) {
    return (
      <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-6">
        <p className="text-emerald-300 font-medium flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          You are checked in.
        </p>
      </div>
    );
  }

  if (!status.selfCheckInEnabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121a] px-5 py-6 space-y-2">
        <Header />
        <p className="text-sm text-gray-400">
          Self check-in is not enabled. Ask an organiser at the desk.
        </p>
      </div>
    );
  }

  if (!status.active) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 space-y-2">
        <Header />
        {status.opensAt && status.closesAt ? (
          <p className="text-sm text-gray-400">
            Not open yet (or closed). Window:{" "}
            <span className="text-gray-300">{formatWhen(status.opensAt)}</span> –{" "}
            <span className="text-gray-300">{formatWhen(status.closesAt)}</span>.
          </p>
        ) : (
          <p className="text-sm text-gray-400">No check-in window is configured yet.</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.07] px-5 py-6 space-y-4",
        "shadow-lg shadow-cyan-500/5"
      )}
    >
      <Header highlight />
      <p className="text-xs text-gray-400 leading-relaxed">
        Enter the 6-digit code shown at the venue during the check-in window.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(normalizeCheckInCodeInput(e.target.value).slice(0, 6))}
          maxLength={6}
          aria-label="6-digit check-in code"
          className="w-full sm:w-40 min-h-11 bg-gray-950 border border-cyan-500/35 rounded-xl px-3 py-2.5 text-white font-mono tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
        <Button
          type="submit"
          disabled={submitting}
          className="min-h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Confirm attendance
            </>
          )}
        </Button>
      </form>
      {status.opensAt || status.closesAt ? (
        <p className="text-xs text-gray-500">
          Window: {formatWhen(status.opensAt)} – {formatWhen(status.closesAt)}
        </p>
      ) : null}
    </div>
  );
}

function Header({ highlight }: { highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-xs font-bold",
        highlight ? "text-cyan-200" : "text-cyan-300/90"
      )}
    >
      <KeyRound className="h-4 w-4" />
      Mark yourself present
    </div>
  );
}
