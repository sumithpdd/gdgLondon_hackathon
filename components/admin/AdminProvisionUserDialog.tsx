"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/auth";
import {
  provisionHackathonUserByEmail,
  callableErrorMessage,
} from "@/lib/admin-users";
import { getActiveHackathonId } from "@/lib/active-hackathon";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fieldClass =
  "bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProvisioned: () => void;
  initialEmail?: string;
};

export function AdminProvisionUserDialog({
  open,
  onOpenChange,
  onProvisioned,
  initialEmail = "",
}: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initialEmail.trim()) {
      setEmail(initialEmail.trim());
    }
  }, [open, initialEmail]);

  const reset = () => {
    setEmail("");
    setDisplayName("");
    setRole("user");
  };

  const handleClose = (next: boolean) => {
    if (!saving) {
      if (!next) reset();
      onOpenChange(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const result = await provisionHackathonUserByEmail({
        email: trimmed,
        displayName: displayName.trim() || undefined,
        role,
      });
      toast({
        title: result.created ? "User added to hackathon" : "User updated",
        description: `${result.email} is registered for ${getActiveHackathonId()}.`,
      });
      reset();
      onOpenChange(false);
      onProvisioned();
    } catch (err) {
      toast({
        title: "Could not add user",
        description: callableErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-white/15 bg-[#1a1528] text-white sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              Add user to hackathon
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Creates or updates their hackathon profile for{" "}
              <span className="text-gray-300">{getActiveHackathonId()}</span>. They must already have signed in once
              (Firebase Auth account). Audit fields are recorded on the server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provision-email" className="text-gray-200">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="provision-email"
                type="email"
                placeholder="hello@gdglondon.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provision-name" className="text-gray-200">
                Display name (optional)
              </Label>
              <Input
                id="provision-name"
                placeholder="Shown on profile card"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-gray-200"
              onClick={() => handleClose(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add to hackathon"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
