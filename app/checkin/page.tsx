"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { ClipboardCheck, Loader2, UserCheck } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { getAttendanceForUser, upsertCheckIn, type AttendanceCohort } from "@/lib/attendance";
import { isUserDeleted } from "@/lib/auth";

type UserRow = {
  uid: string;
  email: string | null;
  displayName: string;
};

export default function CheckinPage() {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const isAdmin = userProfile?.role === "admin";

  const [selfLoading, setSelfLoading] = useState(false);
  const [selfCheckedIn, setSelfCheckedIn] = useState<boolean | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [tagAidevcamp, setTagAidevcamp] = useState(false);
  const [checkingUid, setCheckingUid] = useState<string | null>(null);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const refreshSelf = useCallback(async () => {
    if (!user) return;
    const a = await getAttendanceForUser(user.uid);
    setSelfCheckedIn(!!a?.attendanceVerified);
  }, [user]);

  useEffect(() => {
    refreshSelf();
  }, [refreshSelf]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const snap = await getDocs(query(collection(db, USERS_COLLECTION), limit(400)));
      const rows: UserRow[] = snap.docs
        .filter((d) => !isUserDeleted({ deletedAt: d.data().deletedAt?.toDate?.() }))
        .map((d) => {
          const data = d.data();
          const display =
            (data.profileDisplayName as string) ||
            (data.displayName as string) ||
            (data.email as string) ||
            d.id;
          return {
            uid: d.id,
            email: (data.email as string) ?? null,
            displayName: display,
          };
        });
      rows.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
      setUsers(rows);
    } catch (e) {
      console.error(e);
      toast({ title: "Could not load users", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [users, search]);

  const slice = useMemo(() => filtered.slice(0, 50), [filtered]);

  useEffect(() => {
    if (!isAdmin || slice.length === 0) return;
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
  }, [isAdmin, slice]);

  const cohortForNext: AttendanceCohort = tagAidevcamp ? "aidevcamp_flat" : null;

  const checkInSelf = async () => {
    if (!user) return;
    setSelfLoading(true);
    try {
      await upsertCheckIn({
        targetUid: user.uid,
        actorUid: user.uid,
        isAdminActor: false,
      });
      toast({ title: "You’re checked in", description: "Attendance recorded for this event." });
      await refreshSelf();
    } catch (e: unknown) {
      toast({
        title: "Check-in failed",
        description: e instanceof Error ? e.message : "Try again or ask an organiser.",
        variant: "destructive",
      });
    } finally {
      setSelfLoading(false);
    }
  };

  const checkInUser = async (targetUid: string) => {
    if (!user || !isAdmin) return;
    setCheckingUid(targetUid);
    try {
      await upsertCheckIn({
        targetUid,
        actorUid: user.uid,
        isAdminActor: true,
        cohort: cohortForNext,
      });
      setCheckedMap((m) => ({ ...m, [targetUid]: true }));
      toast({
        title: "Checked in",
        description: cohortForNext ? "Tagged as AI DevCamp flat cohort." : "Attendance saved.",
      });
    } catch (e: unknown) {
      toast({
        title: "Could not check in",
        description: e instanceof Error ? e.message : "Check rules and Firestore indexes.",
        variant: "destructive",
      });
    } finally {
      setCheckingUid(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-emerald-400" />
              Event check-in
            </h1>
            <p className="text-gray-400 text-sm">
              Confirm in-person attendance for {HACKATHON_DISPLAY_NAME}. A live room code can be added later; for now
              self check-in and admin overrides are supported.
            </p>
          </div>

          <Card className="bg-[#12121a] border-white/10 shadow-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">Your attendance</CardTitle>
              <CardDescription className="text-gray-400">
                Flat, one-tap check-in (AI DevCamp–style). You can update your check-in time by tapping again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selfCheckedIn === null ? (
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
                </p>
              ) : selfCheckedIn ? (
                <p className="text-emerald-400 text-sm font-medium">You are checked in.</p>
              ) : (
                <p className="text-gray-400 text-sm">You are not checked in yet.</p>
              )}
              <Button
                type="button"
                disabled={selfLoading || !user}
                onClick={checkInSelf}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-none rounded-lg font-medium"
              >
                {selfLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {selfCheckedIn ? "Update my check-in" : "Check me in"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="bg-[#12121a] border-white/10 shadow-none rounded-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Admin: check in an attendee</CardTitle>
                <CardDescription className="text-gray-400">
                  For people at the venue without the app flow, or <strong className="text-gray-200">AI DevCamp flat</strong>{" "}
                  cohort guests. Loads up to 400 user profiles from the active dataset.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tagAidevcamp}
                      onChange={(e) => setTagAidevcamp(e.target.checked)}
                      className="rounded border-white/30 bg-[#0a0a0f] text-emerald-600 focus:ring-emerald-500"
                    />
                    Tag next check-ins as <span className="text-emerald-400 font-medium">AI DevCamp flat</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Search name or email</Label>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter…"
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
                      <li key={u.uid} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 bg-[#0a0a0f]/80">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{u.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email || u.uid}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {checkedMap[u.uid] ? (
                            <span className="text-xs text-emerald-400 font-medium px-2">Checked in</span>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            disabled={checkingUid === u.uid}
                            onClick={() => checkInUser(u.uid)}
                            className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-none rounded-lg"
                          >
                            {checkingUid === u.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : checkedMap[u.uid] ? (
                              "Update"
                            ) : (
                              "Check in"
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
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-gray-600">
            Spec: <code className="text-violet-400">docs/IO2026_HACKATHON_SPEC.md</code> §8 · Collection{" "}
            <code className="text-gray-500">ATTENDANCE_COLLECTION</code>
          </p>
      </div>
    </ProtectedRoute>
  );
}
