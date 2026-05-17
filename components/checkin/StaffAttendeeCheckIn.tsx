"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RotateCcw, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAttendanceForUser, type AttendanceCohort } from "@/lib/attendance";
import { listUsersForAdmin, type AdminListedUser } from "@/lib/admin-users";
import { isUserDeleted } from "@/lib/auth";
import { callableCheckInError, resetUserAttendance, staffCheckInUser } from "@/lib/check-in";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logClientError } from "@/lib/clientErrorLogger";

type Props = {
  actorUid: string;
  /** Admins can clear attendance (e.g. mistaken check-in). */
  canResetAttendance?: boolean;
  title?: string;
  description?: string;
};

export function StaffAttendeeCheckIn({
  actorUid,
  canResetAttendance = false,
  title = "Check in an attendee",
  description = "Search the directory and check people in at the desk. Works for admins and moderators.",
}: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminListedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [emailQuick, setEmailQuick] = useState("");
  const [tagAidevcamp, setTagAidevcamp] = useState(false);
  const [checkingUid, setCheckingUid] = useState<string | null>(null);
  const [resettingUid, setResettingUid] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminListedUser | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const list = await listUsersForAdmin();
      setUsers(list.filter((u) => !isUserDeleted(u)));
    } catch {
      toast({ title: "Could not load users", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.displayName?.toLowerCase().includes(q) ?? false) ||
        (u.profileDisplayName?.toLowerCase().includes(q) ?? false) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [users, search]);

  const slice = useMemo(() => filtered.slice(0, 50), [filtered]);

  useEffect(() => {
    if (slice.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, boolean> = {};
      await Promise.all(
        slice.map(async (u) => {
          const a = await getAttendanceForUser(u.uid);
          next[u.uid] = !!a?.attendanceVerified;
        })
      );
      if (!cancelled) setCheckedMap((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [slice]);

  const cohortForNext: AttendanceCohort = tagAidevcamp ? "aidevcamp_flat" : null;

  const checkInUser = async (targetUid: string) => {
    setCheckingUid(targetUid);
    try {
      await staffCheckInUser({ targetUserId: targetUid, cohort: cohortForNext });
      setCheckedMap((m) => ({ ...m, [targetUid]: true }));
      toast({
        title: "Checked in",
        description: cohortForNext ? "Tagged as AI DevCamp flat cohort." : "Attendance saved.",
      });
    } catch (e) {
      toast({
        title: "Could not check in",
        description: callableCheckInError(e),
        variant: "destructive",
      });
    } finally {
      setCheckingUid(null);
    }
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    const uid = resetTarget.uid;
    setResettingUid(uid);
    try {
      await resetUserAttendance(uid);
      setCheckedMap((m) => ({ ...m, [uid]: false }));
      toast({
        title: "Attendance reset",
        description: resetTarget.email || resetTarget.displayName || uid,
      });
      setResetTarget(null);
    } catch (e) {
      logClientError(e, "report");
      toast({
        title: "Reset failed",
        description: callableCheckInError(e),
        variant: "destructive",
      });
    } finally {
      setResettingUid(null);
    }
  };

  const checkInByEmail = async () => {
    const email = emailQuick.trim().toLowerCase();
    if (!email) {
      toast({ title: "Enter an email", variant: "destructive" });
      return;
    }
    setQuickLoading(true);
    try {
      const { userId } = await staffCheckInUser({ email, cohort: cohortForNext });
      setCheckedMap((m) => ({ ...m, [userId]: true }));
      toast({ title: "Checked in", description: email });
      setEmailQuick("");
      void loadUsers();
    } catch (e) {
      toast({
        title: "Could not check in",
        description: callableCheckInError(e),
        variant: "destructive",
      });
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <Card className="bg-[#12121a] border-white/10 shadow-none rounded-xl">
      <CardHeader>
        <CardTitle className="text-white text-lg">{title}</CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
          <Label className="text-gray-300">Quick check-in by email</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="hello@example.com"
              value={emailQuick}
              onChange={(e) => setEmailQuick(e.target.value)}
              className="bg-[#0a0a0f] border-white/15 text-white rounded-lg"
            />
            <Button
              type="button"
              disabled={quickLoading}
              onClick={() => void checkInByEmail()}
              className="bg-violet-600 hover:bg-violet-500 shrink-0"
            >
              {quickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check in"}
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={tagAidevcamp}
            onChange={(e) => setTagAidevcamp(e.target.checked)}
            className="rounded border-white/30 bg-[#0a0a0f] text-emerald-600"
          />
          Tag next check-ins as <span className="text-emerald-400 font-medium">AI DevCamp flat</span>
        </label>

        <div className="space-y-2">
          <Label className="text-gray-300">Search name or email</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter directory…"
            className="bg-[#0a0a0f] border-white/15 text-white placeholder:text-gray-600 rounded-lg"
          />
        </div>

        {loadingUsers ? (
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading directory…
          </p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-lg border border-white/10 overflow-hidden max-h-[420px] overflow-y-auto">
            {slice.map((u) => (
              <li
                key={u.uid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 bg-[#0a0a0f]/80"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {u.displayName || u.profileDisplayName || "No name"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email || u.uid}</p>
                  {u.listedFromLegacy ? (
                    <p className="text-[10px] text-violet-400">Legacy profile</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {checkedMap[u.uid] ? (
                    <span className="text-xs text-emerald-400 font-medium px-2">Checked in</span>
                  ) : null}
                  {canResetAttendance && checkedMap[u.uid] ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={resettingUid === u.uid}
                      onClick={() => setResetTarget(u)}
                      className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                    >
                      {resettingUid === u.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset
                        </>
                      )}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    disabled={checkingUid === u.uid}
                    onClick={() => void checkInUser(u.uid)}
                    className="bg-violet-600 hover:bg-violet-500 text-white border-0"
                  >
                    {checkingUid === u.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : checkedMap[u.uid] ? (
                      "Update"
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Check in
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loadingUsers && filtered.length === 0 && (
          <p className="text-gray-500 text-sm">No users match this filter.</p>
        )}
        <p className="text-xs text-gray-500">{users.length} profiles loaded (active + legacy).</p>
      </CardContent>

      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent className="bg-[#12121a] border-white/15 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset check-in?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Remove attendance for{" "}
              <span className="text-gray-200">
                {resetTarget?.displayName || resetTarget?.email || resetTarget?.uid}
              </span>
              . They will need to check in again before voting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmReset();
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              Reset attendance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
