"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Loader2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAttendanceForUser } from "@/lib/attendance";
import {
  callableCheckInError,
  fetchCheckInPublicConfig,
  formatCheckInWindow,
  getCheckInWindowStatus,
  normalizeCheckInCodeInput,
  selfCheckInWithCode,
} from "@/lib/check-in";

type Props = {
  userId: string | undefined;
  onCheckedIn?: () => void;
};

export function SelfCheckInCard({ userId, onCheckedIn }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [windowLabel, setWindowLabel] = useState("");
  const [windowStatus, setWindowStatus] = useState<ReturnType<typeof getCheckInWindowStatus>>("disabled");
  const [enabled, setEnabled] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [attendance, config] = await Promise.all([
        getAttendanceForUser(userId),
        fetchCheckInPublicConfig(),
      ]);
      setCheckedIn(!!attendance?.attendanceVerified);
      setEnabled(config.selfCheckInEnabled);
      setWindowLabel(formatCheckInWindow(config));
      setWindowStatus(getCheckInWindowStatus(config));
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
      await selfCheckInWithCode(normalized);
      toast({ title: "You’re checked in", description: "Attendance recorded for this event." });
      setCheckedIn(true);
      setCode("");
      onCheckedIn?.();
    } catch (err) {
      toast({
        title: "Check-in failed",
        description: callableCheckInError(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#12121a] border-white/10 shadow-none rounded-xl">
      <CardHeader>
        <CardTitle className="text-cyan-300/90 text-sm font-mono flex items-center gap-2">
          <Key className="h-4 w-4" />
          Self check-in
        </CardTitle>
        <CardDescription className="text-gray-400">
          {enabled
            ? "Enter the code shown at the venue during the check-in window."
            : "Self check-in is not enabled. Ask an organiser at the desk."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
          </p>
        ) : checkedIn ? (
          <p className="text-emerald-400 text-sm font-medium">You are checked in.</p>
        ) : windowStatus !== "open" ? (
          <p className="text-gray-400 text-sm">
            Not open yet (or closed). Window: {windowLabel}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000 000"
              value={code.length > 3 ? `${code.slice(0, 3)} ${code.slice(3)}` : code}
              onChange={(e) => setCode(normalizeCheckInCodeInput(e.target.value).slice(0, 6))}
              className="bg-[#0a0a0f] border-white/15 text-white text-center font-mono text-xl tracking-[0.35em] placeholder:text-gray-600"
              maxLength={7}
            />
            <Button
              type="submit"
              disabled={submitting || !userId}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking in…
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check me in
                </>
              )}
            </Button>
          </form>
        )}
        {!loading && windowStatus === "open" && !checkedIn && (
          <p className="text-xs text-gray-500">Window: {windowLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
