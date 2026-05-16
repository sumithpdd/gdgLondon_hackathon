"use client";

import { useEffect, useState } from "react";
import type { UserProfile, UserRole } from "@/lib/auth";
import { updateUserAsAdmin, type AdminUserUpdate } from "@/lib/admin-users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fieldClass =
  "bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500/50";

type Props = {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actorUid: string;
  onSaved: () => void;
};

export function AdminUserEditDialog({ user, open, onOpenChange, actorUid, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [teamPreference, setTeamPreference] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [buddiesVisible, setBuddiesVisible] = useState(false);
  const [attendance, setAttendance] = useState<string>("");

  useEffect(() => {
    if (!user || !open) return;
    setDisplayName(user.displayName ?? "");
    setProfileDisplayName(user.profileDisplayName ?? "");
    setEmail(user.email ?? "");
    setRole(user.role || "user");
    setBio(user.hackathonBio ?? "");
    setCity(user.city ?? "");
    setCountry(user.country ?? "");
    setTeamPreference(user.teamPreference ?? "");
    setLinkedin(user.hackathonLinkedinUrl ?? "");
    setGithubUrl(user.githubUrl ?? "");
    setWebsiteUrl(user.websiteUrl ?? "");
    setBuddiesVisible(!!user.buddiesVisibleInDirectory);
    if (user.inPersonAttendance === true) setAttendance("yes");
    else if (user.inPersonAttendance === false) setAttendance("no");
    else if (user.inPersonAttendance === null) setAttendance("unsure");
    else setAttendance("");
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let inPersonAttendance: boolean | null | undefined;
      if (attendance === "yes") inPersonAttendance = true;
      else if (attendance === "no") inPersonAttendance = false;
      else if (attendance === "unsure") inPersonAttendance = null;
      else inPersonAttendance = undefined;

      const patch: AdminUserUpdate = {
        displayName,
        profileDisplayName,
        email,
        role,
        hackathonBio: bio,
        city,
        country,
        teamPreference,
        hackathonLinkedinUrl: linkedin,
        githubUrl,
        websiteUrl,
        buddiesVisibleInDirectory: buddiesVisible,
        ...(attendance === "" ? {} : { inPersonAttendance }),
      };

      await updateUserAsAdmin(actorUid, user.uid, patch);
      toast({ title: "User updated", description: "Profile changes saved." });
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save user.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#14101f] text-gray-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Edit user</DialogTitle>
          <DialogDescription className="text-gray-400">
            {user?.uid}
            {user?.deletedAt ? (
              <span className="block text-amber-400/90 mt-1">This account is marked deleted.</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="grid gap-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Display name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Directory name</Label>
                <Input
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email (profile record)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={fieldClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Team preference</Label>
              <Select value={teamPreference || undefined} onValueChange={setTeamPreference}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                  <SelectItem value="solo">Prefer solo</SelectItem>
                  <SelectItem value="team">Prefer a team</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">In-person attendance (planning)</Label>
              <Select value={attendance || undefined} onValueChange={setAttendance}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No (remote)</SelectItem>
                  <SelectItem value="unsure">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">LinkedIn</Label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={fieldClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">GitHub</Label>
                <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Website</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={buddiesVisible}
                onChange={(e) => setBuddiesVisible(e.target.checked)}
                className="rounded border-white/30 bg-black/30 text-emerald-500"
              />
              Visible in Buddies directory
            </label>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !user}
            onClick={() => void handleSave()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
