"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserProfile, UserRole } from "@/lib/auth";
import {
  updateUserAsAdmin,
  formatUserDate,
  callableErrorMessage,
  type AdminUserUpdate,
} from "@/lib/admin-users";
import { getProfileCompletion } from "@/lib/profile-completion";
import { countrySelectOptions, resolveCountryForSelect } from "@/lib/countries";
import { ChipPickList } from "@/components/ChipPickList";
import { TagSelector } from "@/components/TagSelector";
import {
  SKILLS_AND_STACK_OPTIONS,
  CAN_OFFER_OPTIONS,
  mergeSkillTags,
} from "@/lib/profile-buddy-options";
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
import { Loader2, User, MapPin, Sparkles, Link2, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fieldClass =
  "bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500/50";

function EditSection({
  title,
  description,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "violet" | "emerald" | "sky" | "amber";
  children: ReactNode;
}) {
  const accentMap = {
    violet: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/25",
    emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/25",
    sky: "from-sky-500/20 to-blue-500/10 border-sky-500/25",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-500/25",
  };
  const iconColor = {
    violet: "text-violet-300",
    emerald: "text-emerald-300",
    sky: "text-sky-300",
    amber: "text-amber-300",
  }[accent];

  return (
    <section
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 sm:p-5 space-y-4",
        accentMap[accent]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/15 p-2 shrink-0 bg-black/20">
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {description ? <p className="text-xs text-gray-400 mt-0.5">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

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
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "">("");
  const [skillsAndStack, setSkillsAndStack] = useState<string[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [canOfferTags, setCanOfferTags] = useState<string[]>([]);
  const [teamPreference, setTeamPreference] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [buddiesVisible, setBuddiesVisible] = useState(false);
  const [attendance, setAttendance] = useState<string>("");

  const countryChoices = useMemo(() => countrySelectOptions(country), [country]);

  useEffect(() => {
    if (!user || !open) return;
    setDisplayName(user.displayName ?? "");
    setProfileDisplayName(user.profileDisplayName ?? user.displayName ?? "");
    setEmail(user.email ?? "");
    setRole(user.role || "user");
    setBio(user.hackathonBio ?? "");
    setCity(user.city ?? "");
    setCountry(resolveCountryForSelect(user.country));
    setExperienceLevel(user.experienceLevel ?? "");
    setSkillsAndStack(mergeSkillTags(user.programmingSkills ?? user.skills, user.techStack));
    setInterestTags(user.interests ?? user.wantToLearnTags ?? []);
    setExpertiseTags(user.expertise ?? user.domainExpertise ?? []);
    setCanOfferTags(user.canOfferTags ?? []);
    setTeamPreference(user.teamPreference ?? "");
    setLinkedin(user.hackathonLinkedinUrl ?? "");
    setGithubUrl(user.githubUrl ?? "");
    setWebsiteUrl(user.websiteUrl ?? "");
    setTwitterUrl(user.twitterUrl ?? "");
    setFacebookUrl(user.facebookUrl ?? "");
    setInstagramUrl(user.instagramUrl ?? "");
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

      const draftProfile: Partial<UserProfile> = {
        ...user,
        profileDisplayName: profileDisplayName.trim() || displayName.trim(),
        hackathonBio: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        experienceLevel: experienceLevel || undefined,
        hackathonLinkedinUrl: linkedin.trim(),
        teamPreference: teamPreference.trim(),
      };
      const { percent } = getProfileCompletion(draftProfile);

      const patch: AdminUserUpdate = {
        displayName,
        profileDisplayName,
        email,
        role,
        hackathonBio: bio,
        city,
        country,
        experienceLevel,
        programmingSkills: skillsAndStack,
        domainExpertise: expertiseTags,
        interests: interestTags,
        expertise: expertiseTags,
        techStack: skillsAndStack,
        wantToLearnTags: interestTags,
        canOfferTags,
        skills: skillsAndStack,
        hackathonLinkedinUrl: linkedin,
        githubUrl,
        websiteUrl,
        twitterUrl,
        facebookUrl,
        instagramUrl,
        teamPreference,
        buddiesVisibleInDirectory: buddiesVisible,
        profileCompletionPercent: percent,
        ...(attendance === "" ? {} : { inPersonAttendance }),
      };

      await updateUserAsAdmin(actorUid, user.uid, patch);
      toast({ title: "User updated", description: "Profile changes saved." });
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: callableErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0c0814] text-gray-100 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit user profile</DialogTitle>
          <DialogDescription className="text-gray-400 space-y-1">
            <span className="font-mono text-xs block break-all">{user?.uid}</span>
            {user ? (
              <span className="text-xs block text-gray-500">
                Registered {formatUserDate(user.createdAt)}
              </span>
            ) : null}
            {user?.deletedAt ? (
              <span className="block text-amber-400/90">This account is marked deleted.</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-5 py-1">
            <EditSection title="Account" description="Auth record and access" icon={Shield} accent="emerald">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Display name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Directory / profile name</Label>
                  <Input
                    value={profileDisplayName}
                    onChange={(e) => setProfileDisplayName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
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
              </div>
            </EditSection>

            <EditSection title="About you" icon={User} accent="violet">
              <div className="space-y-2">
                <Label className="text-gray-300">Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Experience level</Label>
                <Select
                  value={experienceLevel || undefined}
                  onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </EditSection>

            <EditSection title="Location" icon={MapPin} accent="emerald">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Country</Label>
                  <Select value={country || undefined} onValueChange={setCountry}>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(24rem,70vh)] bg-[#1a1625] border-white/10 text-gray-100">
                      {countryChoices.map((name) => (
                        <SelectItem key={name} value={name} className="focus:bg-white/10">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EditSection>

            <EditSection
              title="Skills & tags"
              description="Same fields as the participant profile"
              icon={Sparkles}
              accent="violet"
            >
              <ChipPickList
                label="Programming skills & technology stack"
                options={[...SKILLS_AND_STACK_OPTIONS]}
                selected={skillsAndStack}
                onChange={setSkillsAndStack}
                accentSelected="bg-violet-600/30 border-violet-400 text-violet-100"
                accentRing="ring-violet-400/50"
              />
              <TagSelector
                category="interests"
                selectedTags={interestTags}
                onChange={setInterestTags}
                label="Interests"
                theme="hackathon"
                required={false}
                allowCreate
                createScope="profile"
              />
              <TagSelector
                category="expertise"
                selectedTags={expertiseTags}
                onChange={setExpertiseTags}
                label="Expertise"
                theme="hackathon"
                required={false}
                allowCreate
                createScope="profile"
              />
              <ChipPickList
                label="I can offer / help with"
                options={[...CAN_OFFER_OPTIONS]}
                selected={canOfferTags}
                onChange={setCanOfferTags}
                accentSelected="bg-sky-600/25 border-sky-400 text-sky-100"
                accentRing="ring-sky-400/50"
              />
            </EditSection>

            <EditSection title="Links & social" icon={Link2} accent="sky">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-gray-300">LinkedIn</Label>
                  <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">GitHub</Label>
                  <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Website</Label>
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">X (Twitter)</Label>
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Facebook</Label>
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-gray-300">Instagram</Label>
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={fieldClass} />
                </div>
              </div>
            </EditSection>

            <EditSection title="Preferences" icon={Users} accent="amber">
              <div className="space-y-2">
                <Label className="text-gray-300">Team preference</Label>
                <Select value={teamPreference || undefined} onValueChange={setTeamPreference}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Choose one" />
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
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={buddiesVisible}
                  onChange={(e) => setBuddiesVisible(e.target.checked)}
                  className="rounded border-white/30 bg-black/30 text-emerald-500"
                />
                Visible in Buddies directory
              </label>
            </EditSection>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-[#0c0814] pt-2 border-t border-white/10">
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
