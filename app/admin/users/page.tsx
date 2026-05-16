"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION } from "@/lib/constants";
import { UserProfile, UserRole, isUserDeleted } from "@/lib/auth";
import { parseUserProfileDoc, softDeleteUser, restoreUser } from "@/lib/admin-users";
import { AdminUserEditDialog } from "@/components/admin/AdminUserEditDialog";
import { getProfileCompletion } from "@/lib/profile-completion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  UserCog,
  User,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | UserRole;
type StatusFilter = "active" | "deleted" | "all";
type SortMode = "newest" | "oldest" | "name";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function matchesSearch(u: UserProfile, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  const partKeys = u.hackathonParticipations ? Object.keys(u.hackathonParticipations) : [];
  return (
    (u.email?.toLowerCase().includes(s) ?? false) ||
    (u.displayName?.toLowerCase().includes(s) ?? false) ||
    (u.profileDisplayName?.toLowerCase().includes(s) ?? false) ||
    u.uid.toLowerCase().includes(s) ||
    partKeys.some((k) => k.toLowerCase().includes(s))
  );
}

function participationSummary(u: UserProfile): string {
  const p = u.hackathonParticipations;
  if (!p || !Object.keys(p).length) return "—";
  return Object.keys(p).join(", ");
}

export default function AdminUsersPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
      const usersList = usersSnapshot.docs.map((d) => parseUserProfileDoc(d.id, d.data()));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredSorted = useMemo(() => {
    let list = users.filter((u) => matchesSearch(u, searchQuery));
    if (incompleteOnly) {
      list = list.filter((u) => !getProfileCompletion(u).complete);
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => (u.role || "user") === roleFilter);
    }
    if (statusFilter === "active") {
      list = list.filter((u) => !isUserDeleted(u));
    } else if (statusFilter === "deleted") {
      list = list.filter((u) => isUserDeleted(u));
    }
    const out = [...list];
    out.sort((a, b) => {
      if (sortMode === "name") {
        const an = (a.displayName || a.email || a.uid).toLowerCase();
        const bn = (b.displayName || b.email || b.uid).toLowerCase();
        return an.localeCompare(bn);
      }
      const at = a.createdAt?.getTime() ?? 0;
      const bt = b.createdAt?.getTime() ?? 0;
      return sortMode === "newest" ? bt - at : at - bt;
    });
    return out;
  }, [users, searchQuery, incompleteOnly, roleFilter, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages, pageSize, filteredSorted.length]);

  const pageSlice = useMemo(() => {
    const start = page * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  const handleSoftDelete = async () => {
    if (!user || !deleteTarget) return;
    setActionLoading(true);
    try {
      await softDeleteUser(user.uid, deleteTarget.uid);
      toast({
        title: "User marked deleted",
        description: "The account is deactivated and hidden from directories.",
      });
      setDeleteTarget(null);
      void fetchUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not delete user.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (target: UserProfile) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await restoreUser(user.uid, target.uid);
      toast({ title: "User restored", description: "Account is active again." });
      void fetchUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not restore user.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!user) return;
    const now = new Date();
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        role: newRole,
        updatedAt: now,
        updatedBy: user.uid,
        updatedDate: now,
      });

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      void fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-red-600/90 text-white border-0">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (role === "moderator") {
      return (
        <Badge className="bg-blue-600/90 text-white border-0">
          <UserCog className="w-3 h-3 mr-1" />
          Moderator
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-white/10 text-gray-200 border border-white/10">
        <User className="w-3 h-3 mr-1" />
        User
      </Badge>
    );
  };

  const UserManageActions = ({ rowUser, compact }: { rowUser: UserProfile; compact?: boolean }) => {
    const deleted = isUserDeleted(rowUser);
    const isSelf = user?.uid === rowUser.uid;

    return (
      <div className={cn("flex flex-wrap gap-1", compact && "justify-end")}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditUser(rowUser)}
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
        >
          <Pencil className="w-3 h-3 sm:mr-1" />
          {!compact && "Edit"}
        </Button>
        {deleted ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={actionLoading}
            onClick={() => void handleRestore(rowUser)}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 h-8 px-2"
          >
            <RotateCcw className="w-3 h-3 sm:mr-1" />
            {!compact && "Restore"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSelf || actionLoading}
            onClick={() => setDeleteTarget(rowUser)}
            className="border-red-500/40 text-red-300 hover:bg-red-500/10 h-8 px-2"
            title={isSelf ? "You cannot delete your own account" : "Mark as deleted"}
          >
            <Trash2 className="w-3 h-3 sm:mr-1" />
            {!compact && "Delete"}
          </Button>
        )}
      </div>
    );
  };

  const RoleActions = ({
    rowUser,
    compact,
  }: {
    rowUser: UserProfile;
    compact?: boolean;
  }) => {
    const currentRole = rowUser.role || "user";
    const btnClass = compact
      ? "h-8 px-2 text-xs"
      : "text-xs sm:text-sm";

    return (
      <div className={cn("flex gap-1 flex-wrap", compact && "justify-end")}>
        <Button
          type="button"
          onClick={() => void updateUserRole(rowUser.uid, "admin")}
          variant={currentRole === "admin" ? "default" : "outline"}
          size="sm"
          disabled={currentRole === "admin"}
          className={cn(currentRole === "admin" ? "bg-red-600 hover:bg-red-700" : "border-white/20 text-white hover:bg-white/10", btnClass)}
        >
          <Shield className="w-3 h-3 sm:mr-1" />
          {!compact && "Admin"}
        </Button>
        <Button
          type="button"
          onClick={() => void updateUserRole(rowUser.uid, "moderator")}
          variant={currentRole === "moderator" ? "default" : "outline"}
          size="sm"
          disabled={currentRole === "moderator"}
          className={cn(
            currentRole === "moderator" ? "bg-blue-600 hover:bg-blue-700" : "border-white/20 text-white hover:bg-white/10",
            btnClass
          )}
        >
          <UserCog className="w-3 h-3 sm:mr-1" />
          {!compact && "Mod"}
        </Button>
        <Button
          type="button"
          onClick={() => void updateUserRole(rowUser.uid, "user")}
          variant="outline"
          size="sm"
          disabled={currentRole === "user"}
          className={cn("border-white/20 text-white hover:bg-white/10", btnClass)}
        >
          User
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <AdminShell title="Users" subtitle="Loading directory…">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500/30 border-t-emerald-400 mx-auto" />
              <p className="mt-4 text-gray-400">Loading users…</p>
            </div>
          </div>
        </AdminShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminShell
        title="Users"
        subtitle="Edit profiles, change roles, or mark users as deleted (soft delete). Deleted accounts stay in Firestore for audit."
      >
        <Card className="border-white/10 bg-[#1a1528]/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-emerald-400" />
              User directory
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filteredSorted.length} of {users.length} users match the current filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search name, email, or user id…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    className="border-white/15 bg-black/25 pl-9 text-white placeholder:text-gray-500"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v as RoleFilter);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px] border-white/15 bg-black/25 text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortMode}
                  onValueChange={(v) => {
                    setSortMode(v as SortMode);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px] border-white/15 bg-black/25 text-white">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="name">Name A–Z</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as StatusFilter);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[140px] border-white/15 bg-black/25 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="deleted">Deleted only</SelectItem>
                    <SelectItem value="all">All statuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={incompleteOnly}
                    onChange={(e) => {
                      setIncompleteOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="rounded border-white/30 bg-black/30 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Incomplete team-join profile only
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number]);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[88px] border-white/15 bg-black/25 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Tabs defaultValue="grid" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 border border-white/10 bg-black/20 p-1">
                <TabsTrigger
                  value="grid"
                  className="gap-2 data-[state=active]:bg-emerald-600/25 data-[state=active]:text-emerald-300"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="gap-2 data-[state=active]:bg-emerald-600/25 data-[state=active]:text-emerald-300"
                >
                  <List className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>

              <TabsContent value="grid" className="mt-6">
                {pageSlice.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {pageSlice.map((u) => {
                      const currentRole = u.role || "user";
                      const { percent, complete } = getProfileCompletion(u);
                      return (
                        <Card
                          key={u.uid}
                          className="border-white/10 bg-[#0f0a18]/90 transition-colors hover:border-violet-500/30"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate">
                                  {u.displayName || u.profileDisplayName || "No name"}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{u.email || "—"}</p>
                                <p className="text-[10px] text-gray-500 font-mono truncate mt-1" title={u.uid}>
                                  {u.uid}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {getRoleBadge(currentRole)}
                              {isUserDeleted(u) && (
                                <Badge className="bg-amber-900/60 text-amber-200 border border-amber-500/40">
                                  Deleted
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={
                                  complete
                                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                                    : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                }
                              >
                                Profile {percent}%
                              </Badge>
                            </div>
                            <p className="text-[11px] text-violet-300/90 font-mono break-all" title={participationSummary(u)}>
                              Hackathons: {participationSummary(u)}
                            </p>
                            <UserManageActions rowUser={u} />
                            <RoleActions rowUser={u} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="table" className="mt-6">
                {pageSlice.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[880px] text-left text-sm">
                      <thead className="border-b border-white/10 bg-black/30 text-gray-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">User ID</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Profile</th>
                          <th className="px-4 py-3 font-medium text-right">Manage</th>
                          <th className="px-4 py-3 font-medium text-right">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {pageSlice.map((u) => {
                          const currentRole = u.role || "user";
                          const { percent, complete } = getProfileCompletion(u);
                          return (
                            <tr key={u.uid} className="bg-[#0f0a18]/40 hover:bg-[#1a1528]/60">
                              <td className="px-4 py-3 text-white font-medium">
                                {u.displayName || u.profileDisplayName || "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate" title={u.email || ""}>
                                {u.email || "—"}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate" title={u.uid}>
                                {u.uid}
                              </td>
                              <td className="px-4 py-3">{getRoleBadge(currentRole)}</td>
                              <td className="px-4 py-3">
                                {isUserDeleted(u) ? (
                                  <Badge className="bg-amber-900/50 text-amber-200 border-amber-500/30">Deleted</Badge>
                                ) : (
                                  <span className="text-emerald-400/90 text-xs">Active</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={complete ? "text-emerald-400" : "text-amber-300"}>{percent}%</span>
                              </td>
                              <td className="px-4 py-3">
                                <UserManageActions rowUser={u} compact />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end">
                                  <RoleActions rowUser={u} compact />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {filteredSorted.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-6">
                <p className="text-sm text-gray-400">
                  Page <span className="text-white font-medium">{page + 1}</span> of{" "}
                  <span className="text-white font-medium">{totalPages}</span>
                  <span className="text-gray-500"> · </span>
                  Showing{" "}
                  <span className="text-white font-medium">
                    {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredSorted.length)}
                  </span>{" "}
                  of <span className="text-white font-medium">{filteredSorted.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 text-sm text-gray-300">
              <h4 className="font-semibold text-violet-200 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role definitions
              </h4>
              <ul className="space-y-2 list-disc list-inside marker:text-violet-400">
                <li>
                  <strong className="text-white">Admin:</strong> full access — submissions, winners, tags, users.
                </li>
                <li>
                  <strong className="text-white">Moderator:</strong> view-focused panel access.
                </li>
                <li>
                  <strong className="text-white">User:</strong> standard participant.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <AdminUserEditDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          actorUid={user?.uid ?? ""}
          onSaved={() => void fetchUsers()}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="border-white/10 bg-[#14101f] text-gray-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Mark user as deleted?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {deleteTarget?.displayName || deleteTarget?.email || deleteTarget?.uid} will be deactivated and hidden
                from the Buddies directory. Their Firestore record is kept for audit. You can restore them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20 bg-transparent text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={actionLoading}
                onClick={(e) => {
                  e.preventDefault();
                  void handleSoftDelete();
                }}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {actionLoading ? "Deleting…" : "Mark deleted"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminShell>
    </ProtectedRoute>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-16 rounded-xl border border-dashed border-white/15 bg-black/20">
      <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
      <p className="text-gray-300">
        {searchQuery.trim() ? `No users match “${searchQuery}”.` : "No users match these filters."}
      </p>
      <p className="text-sm text-gray-500 mt-2">Try clearing search or changing role filters.</p>
    </div>
  );
}
