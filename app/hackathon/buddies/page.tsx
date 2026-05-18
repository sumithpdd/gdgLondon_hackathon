"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION, BUDDIES_FEATURE_LABEL } from "@/lib/constants";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatLocaleDate } from "@/lib/format-date";
import {
  listDirectoryProfiles,
  listIncomingBuddyRequests,
  listOutgoingBuddyRequests,
  listAcceptedBuddies,
  createBuddyRequest,
  respondBuddyRequest,
  cancelOutgoingBuddyRequest,
  getUserPublicSnippet,
  type DirectoryProfile,
} from "@/lib/buddies";
import type { BuddyRequest } from "@/types/buddy-request";
import { Users, Inbox, Heart, Search, Shield } from "lucide-react";

type AdminDirectoryRow = {
  uid: string;
  displayName: string;
  city?: string;
  country?: string;
  publicDir: boolean;
};

export default function BuddiesPage() {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const [tab, setTab] = useState("discover");
  const [directory, setDirectory] = useState<DirectoryProfile[]>([]);
  const [incoming, setIncoming] = useState<BuddyRequest[]>([]);
  const [outgoing, setOutgoing] = useState<BuddyRequest[]>([]);
  const [accepted, setAccepted] = useState<BuddyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adminRows, setAdminRows] = useState<AdminDirectoryRow[]>([]);

  const isAdmin = userProfile?.role === "admin";

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dir, inc, out, acc] = await Promise.all([
        listDirectoryProfiles(),
        listIncomingBuddyRequests(user.uid),
        listOutgoingBuddyRequests(user.uid),
        listAcceptedBuddies(user.uid),
      ]);
      setDirectory(dir.filter((p) => p.uid !== user.uid));
      setIncoming(inc);
      setOutgoing(out);
      setAccepted(acc);
      if (isAdmin) {
        const snap = await getDocs(query(collection(db, USERS_COLLECTION), limit(200)));
        setAdminRows(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              displayName: (data.profileDisplayName as string) || (data.displayName as string) || d.id,
              city: data.city as string | undefined,
              country: data.country as string | undefined,
              publicDir: !!data.buddiesVisibleInDirectory,
            };
          })
        );
      }
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: "Could not load buddies",
        description: e instanceof Error ? e.message : "Check rules and indexes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = directory.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      (p.city ?? "").toLowerCase().includes(q) ||
      (p.country ?? "").toLowerCase().includes(q) ||
      (p.bio ?? "").toLowerCase().includes(q)
    );
  });

  const sendRequest = async (to: DirectoryProfile) => {
    if (!user) return;
    try {
      await createBuddyRequest({
        fromUid: user.uid,
        toUid: to.uid,
        fromDisplayName: userProfile?.profileDisplayName || userProfile?.displayName || user.displayName || user.email || "Attendee",
        toDisplayName: to.displayName,
      });
      toast({ title: "Buddy request sent", description: `Waiting on ${to.displayName}.` });
      refresh();
    } catch (e: unknown) {
      toast({
        title: "Could not send request",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const respond = async (req: BuddyRequest, status: "accepted" | "declined") => {
    if (!user) return;
    try {
      await respondBuddyRequest(req.id, user.uid, status);
      toast({ title: status === "accepted" ? "Accepted" : "Declined", description: req.fromDisplayName });
      refresh();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Update failed",
        variant: "destructive",
      });
    }
  };

  const cancelOutgoing = async (req: BuddyRequest) => {
    try {
      await cancelOutgoingBuddyRequest(req.id);
      toast({ title: "Request withdrawn" });
      refresh();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const otherUid = (r: BuddyRequest) => (r.fromUserId === user?.uid ? r.toUserId : r.fromUserId);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Heart className="h-6 w-6 fill-emerald-500/30" />
            <h1 className="text-2xl font-bold text-white">{BUDDIES_FEATURE_LABEL}</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Meet people who opted into the directory, swap buddy requests, and team up. Explore what others are shipping
            in the{" "}
            <Link href="/hackathon/gallery" className="text-emerald-400 underline-offset-2 hover:underline">
              project gallery
            </Link>{" "}
            when it&apos;s open.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap justify-start gap-1">
            <TabsTrigger
              value="discover"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2"
            >
              <Users className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2 relative"
            >
              <Inbox className="h-4 w-4" />
              Requests
              {incoming.length > 0 && (
                <Badge className="ml-1 h-5 min-w-[1.25rem] px-1 bg-white/20 text-white text-xs">{incoming.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="buddies" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2">
              <Heart className="h-4 w-4" />
              My buddies
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-red-600 data-[state=active]:text-white gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="discover" className="mt-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name, city, or keyword…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading…</p>
            ) : filtered.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center text-gray-400">
                  No public profiles yet. Ask attendees to turn on <strong className="text-gray-200">Public directory</strong>{" "}
                  under {BUDDIES_FEATURE_LABEL} in{" "}
                  <Link href="/hackathon/profile" className="text-emerald-400 underline">
                    My profile
                  </Link>
                  .
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((p) => (
                  <Card key={p.uid} className="bg-white/5 border-white/10 overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{p.displayName}</h3>
                          <p className="text-sm text-gray-500">
                            {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-500 shrink-0 text-xs" disabled>
                          View
                        </Button>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-4">{p.bio || "No bio yet."}</p>
                      {p.programmingSkills && p.programmingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.programmingSkills.slice(0, 6).map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/25 text-violet-200 border border-violet-500/30">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => sendRequest(p)}
                      >
                        Buddy request
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">
                Incoming ({incoming.length})
              </h2>
              {incoming.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {incoming.map((r) => (
                    <Card key={r.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{r.fromDisplayName}</p>
                          <p className="text-xs text-gray-500">wants to connect</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => respond(r, "accepted")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => respond(r, "declined")}>
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Outgoing (pending)</h2>
              {outgoing.length === 0 ? (
                <p className="text-gray-500 text-sm">You have no outgoing pending requests.</p>
              ) : (
                <div className="space-y-2">
                  {outgoing.map((r) => (
                    <Card key={r.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4 flex justify-between items-center gap-2">
                        <p className="text-sm text-gray-300">
                          Waiting on <strong className="text-white">{r.toDisplayName || "attendee"}</strong>
                        </p>
                        <Button size="sm" variant="outline" className="border-white/20 text-gray-200 shrink-0" onClick={() => cancelOutgoing(r)}>
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="buddies" className="mt-6 space-y-4">
            {accepted.length === 0 ? (
              <p className="text-gray-500 text-sm">No buddies yet — accept requests or send some from Discover.</p>
            ) : (
              <BuddyCardsList requests={accepted} currentUid={user!.uid} />
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-6 space-y-4">
              <p className="text-sm text-gray-400">
                Directory overview (first 200 user docs). Full moderation tools can extend this tab.
              </p>
              <div className="rounded-lg border border-white/10 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-gray-400">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Public</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminRows.map((row) => (
                      <tr key={row.uid} className="border-t border-white/10">
                        <td className="p-2 text-white">{row.displayName}</td>
                        <td className="p-2 text-gray-400">{[row.city, row.country].filter(Boolean).join(", ") || "—"}</td>
                        <td className="p-2">
                          {row.publicDir ? <span className="text-emerald-400">Yes</span> : <span className="text-gray-500">No</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

function BuddyCardsList({ requests, currentUid }: { requests: BuddyRequest[]; currentUid: string }) {
  const [snippets, setSnippets] = useState<Record<string, DirectoryProfile | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, DirectoryProfile | null> = {};
      for (const r of requests) {
        const uid = r.fromUserId === currentUid ? r.toUserId : r.fromUserId;
        if (map[uid] === undefined) map[uid] = await getUserPublicSnippet(uid);
      }
      if (!cancelled) setSnippets(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [requests, currentUid]);

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {requests.map((r) => {
        const uid = r.fromUserId === currentUid ? r.toUserId : r.fromUserId;
        const p = snippets[uid];
        const since = formatLocaleDate(r.respondedAt, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return (
          <Card key={r.id} className="bg-white/5 border-white/10">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-lg">{p?.displayName || "Buddy"}</h3>
                  <p className="text-xs text-gray-500">
                    {[p?.city, p?.country].filter(Boolean).join(", ") || "—"} · Buddies since {since || "—"}
                  </p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wide text-gray-500">About</p>
              <p className="text-sm text-gray-300 line-clamp-4">{p?.bio || "—"}</p>
              <p className="text-xs uppercase tracking-wide text-gray-500">Links</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {p?.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    GitHub
                  </a>
                )}
                {p?.hackathonLinkedinUrl && (
                  <a
                    href={p.hackathonLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
                {!p?.githubUrl && !p?.hackathonLinkedinUrl && <span className="text-gray-500 text-xs">No links shared</span>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
