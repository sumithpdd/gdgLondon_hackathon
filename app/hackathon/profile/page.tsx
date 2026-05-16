"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION, HACKATHON_DISPLAY_NAME, BUDDIES_FEATURE_LABEL } from "@/lib/constants";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProfileCompletion, getExtendedProfileSteps } from "@/lib/profile-completion";
import { getAttendanceForUser } from "@/lib/attendance";
import { countrySelectOptions, resolveCountryForSelect } from "@/lib/countries";
import { ChipPickList } from "@/components/ChipPickList";
import { TagSelector } from "@/components/TagSelector";
import { CopyableField, CopyableValueBar } from "@/components/CopyableField";
import {
  PROGRAMMING_SKILL_OPTIONS,
  CAN_OFFER_OPTIONS,
} from "@/lib/profile-buddy-options";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  Heart,
  Check,
  ArrowRight,
  User,
  MapPin,
  Sparkles,
  Link2,
  Users,
  ClipboardCheck,
} from "lucide-react";

const fieldClass =
  "bg-white/5 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/80 focus-visible:border-violet-500/40";

const TEAM_PREF_LABELS: Record<string, string> = {
  solo: "Prefer solo",
  team: "Prefer a team",
  flexible: "Flexible",
};

function ProfileSection({
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
        "rounded-2xl border bg-gradient-to-br p-5 sm:p-6 space-y-5 shadow-lg shadow-black/10",
        accentMap[accent]
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-xl border p-2.5 shrink-0 bg-black/20",
            accent === "violet" && "border-violet-400/30",
            accent === "emerald" && "border-emerald-400/30",
            accent === "sky" && "border-sky-400/30",
            accent === "amber" && "border-amber-400/30"
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          {description ? <p className="text-sm text-gray-400 mt-0.5">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function HackathonProfilePage() {
  const { user, userProfile, refreshProfile } = useAuthContext();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "">("");
  const [programmingSkills, setProgrammingSkills] = useState<string[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [techStackTags, setTechStackTags] = useState<string[]>([]);
  const [canOfferTags, setCanOfferTags] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [teamPreference, setTeamPreference] = useState("");
  const [attendance, setAttendance] = useState<string>("");
  const [eventCheckedIn, setEventCheckedIn] = useState<boolean | null>(null);
  const [buddiesVisible, setBuddiesVisible] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!userProfile) return;
    setProfileDisplayName(userProfile.profileDisplayName ?? userProfile.displayName ?? "");
    setBio(userProfile.hackathonBio ?? "");
    setCity(userProfile.city ?? "");
    setCountry(resolveCountryForSelect(userProfile.country));
    setExperienceLevel(userProfile.experienceLevel ?? "");
    setProgrammingSkills(userProfile.programmingSkills ?? userProfile.skills ?? []);
    setInterestTags(userProfile.interests ?? userProfile.wantToLearnTags ?? []);
    setExpertiseTags(userProfile.expertise ?? userProfile.domainExpertise ?? []);
    setTechStackTags(userProfile.techStack ?? []);
    setCanOfferTags(userProfile.canOfferTags ?? []);
    setLinkedin(userProfile.hackathonLinkedinUrl ?? "");
    setGithubUrl(userProfile.githubUrl ?? "");
    setWebsiteUrl(userProfile.websiteUrl ?? "");
    setTwitterUrl(userProfile.twitterUrl ?? "");
    setFacebookUrl(userProfile.facebookUrl ?? "");
    setInstagramUrl(userProfile.instagramUrl ?? "");
    setTeamPreference(userProfile.teamPreference ?? "");
    if (userProfile.inPersonAttendance === true) setAttendance("yes");
    else if (userProfile.inPersonAttendance === false) setAttendance("no");
    else if (userProfile.inPersonAttendance === null) setAttendance("unsure");
    else setAttendance("");
    setBuddiesVisible(!!userProfile.buddiesVisibleInDirectory);
  }, [userProfile]);

  useEffect(() => {
    if (!user) {
      setEventCheckedIn(null);
      return;
    }
    let cancelled = false;
    void getAttendanceForUser(user.uid).then((a) => {
      if (!cancelled) setEventCheckedIn(!!a?.attendanceVerified);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const completion = getProfileCompletion(userProfile, { eventCheckedIn: eventCheckedIn ?? false });
  const ext = getExtendedProfileSteps({
    ...userProfile,
    profileDisplayName,
    hackathonBio: bio,
    city,
    country,
    experienceLevel: experienceLevel || undefined,
    programmingSkills,
    interests: interestTags,
    expertise: expertiseTags,
    techStack: techStackTags,
    wantToLearnTags: interestTags,
    domainExpertise: expertiseTags,
    canOfferTags,
    hackathonLinkedinUrl: linkedin,
    githubUrl,
    websiteUrl,
    twitterUrl,
    facebookUrl,
    instagramUrl,
  });

  const initials = useMemo(() => {
    const name = profileDisplayName.trim() || user?.displayName || user?.email || "?";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [profileDisplayName, user]);

  const locationLine = [city, country].filter(Boolean).join(", ");
  const teamPrefLabel = teamPreference ? TEAM_PREF_LABELS[teamPreference] ?? teamPreference : "";
  const attendanceDisplay = isAdmin
    ? attendance === "yes"
      ? "Yes — in person"
      : attendance === "no"
        ? "No — remote only"
        : attendance === "unsure"
          ? "Not sure yet"
          : ""
    : eventCheckedIn
      ? "Checked in at the event"
      : "Not checked in yet";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let inPersonAttendance: boolean | null | undefined;
      if (isAdmin) {
        if (attendance === "yes") inPersonAttendance = true;
        else if (attendance === "no") inPersonAttendance = false;
        else if (attendance === "unsure") inPersonAttendance = null;
        else inPersonAttendance = undefined;
      }

      const draft = {
        profileDisplayName: profileDisplayName.trim() || user.displayName || user.email?.split("@")[0],
        hackathonBio: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        experienceLevel: experienceLevel || undefined,
        programmingSkills,
        domainExpertise: expertiseTags,
        interests: interestTags,
        expertise: expertiseTags,
        techStack: techStackTags,
        wantToLearnTags: interestTags,
        canOfferTags,
        skills: programmingSkills,
        hackathonLinkedinUrl: linkedin.trim(),
        githubUrl: githubUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        teamPreference: teamPreference.trim(),
        buddiesVisibleInDirectory: buddiesVisible,
        ...(isAdmin && attendance !== "" ? { inPersonAttendance } : {}),
      };

      const { percent } = getProfileCompletion(
        {
          ...userProfile,
          ...draft,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: userProfile?.role ?? "user",
          createdAt: userProfile?.createdAt ?? new Date(),
          updatedAt: userProfile?.updatedAt ?? new Date(),
        },
        { eventCheckedIn: eventCheckedIn ?? false }
      );

      const now = new Date();
      await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
        ...draft,
        profileCompletionPercent: percent,
        updatedAt: now,
        updatedBy: user.uid,
        updatedDate: now,
      });

      await refreshProfile();
      toast({
        title: "Profile saved",
        description: `${percent}% team join score · ${ext.done}/${ext.total} profile depth.`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save profile.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const countryChoices = useMemo(() => countrySelectOptions(country), [country]);

  const xpBtn = (level: "beginner" | "intermediate" | "advanced", label: string) => (
    <button
      key={level}
      type="button"
      onClick={() => setExperienceLevel(level)}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
        experienceLevel === level
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40 scale-[1.02]"
          : "bg-white/5 border border-white/15 text-gray-300 hover:bg-white/10 hover:border-white/25"
      )}
    >
      {label}
    </button>
  );

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto pb-28 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/90 via-[#14101f] to-fuchsia-950/50 p-6 sm:p-8 shadow-2xl shadow-violet-950/40">
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col sm:flex-row gap-6 sm:items-center">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-70 blur-sm" />
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-2xl sm:text-3xl font-bold text-white shadow-xl">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 font-medium">My profile</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate mt-1">
                  {profileDisplayName.trim() || "Your hackathon identity"}
                </h1>
                {user?.email ? (
                  <div className="mt-2 max-w-md">
                    <CopyableField label="Account email" value={user.email} readOnly />
                  </div>
                ) : null}
                <p className="text-gray-500 text-xs mt-2">{HACKATHON_DISPLAY_NAME}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Profile depth</p>
                  <p className="text-lg font-bold text-emerald-300 tabular-nums">
                    {ext.done}/{ext.total}
                  </p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${(ext.done / ext.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Team join score</p>
                  <p className="text-lg font-bold text-violet-300 tabular-nums">{completion.percent}%</p>
                  {completion.complete ? (
                    <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Ready to join teams
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-500 mt-1">Complete gaps below</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buddies card */}
        <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-[#0d1210] text-gray-100 shadow-xl shadow-emerald-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <Heart className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-lg text-white">{BUDDIES_FEATURE_LABEL}</CardTitle>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/40 text-emerald-100 border border-emerald-500/40">
                  Networking
                </span>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase text-gray-400">Public directory</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={buddiesVisible}
                  onClick={() => setBuddiesVisible(!buddiesVisible)}
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                    buddiesVisible ? "bg-emerald-600 shadow-lg shadow-emerald-900/50" : "bg-white/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                      buddiesVisible ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <p className="text-xs text-emerald-200/80">{buddiesVisible ? "Visible" : "Hidden"}</p>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Find teammates and collaborators. Save below to apply directory visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-white/10 pt-4">
            <Button
              size="sm"
              asChild
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30"
            >
              <Link href="/hackathon/buddies" className="inline-flex items-center gap-2">
                Open {BUDDIES_FEATURE_LABEL}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {!completion.complete && (
          <div className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-950/40 to-amber-900/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium mb-1">For idea gallery join requests:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-100/90">
              {completion.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div id="profile-details-start" className="space-y-6">
          <ProfileSection
            title="About you"
            description="How others see you in the directory"
            icon={User}
            accent="violet"
          >
            <CopyableField
              id="display-name"
              label="Display name"
              value={profileDisplayName}
              onChange={setProfileDisplayName}
              placeholder="How you want to appear"
            />
            <CopyableField
              id="bio"
              label="Bio"
              value={bio}
              onChange={setBio}
              multiline
              rows={5}
              placeholder="Who you are, what you build with AI, what you want from the weekend…"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-200">Experience level</p>
              <div className="flex flex-wrap gap-2">{xpBtn("beginner", "Beginner")}{xpBtn("intermediate", "Intermediate")}{xpBtn("advanced", "Advanced")}</div>
            </div>
          </ProfileSection>

          <ProfileSection title="Location" description="City and country for matching" icon={MapPin} accent="emerald">
            <div className="grid sm:grid-cols-2 gap-4">
              <CopyableField label={<>City <span className="text-red-400">*</span></>} value={city} onChange={setCity} placeholder="London" />
              <CopyableValueBar label="Country *" value={country}>
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
              </CopyableValueBar>
            </div>
            {locationLine ? (
              <p className="text-xs text-emerald-300/90 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {locationLine}
              </p>
            ) : null}
          </ProfileSection>

          <ProfileSection
            title="Skills & tags"
            description="Pick from suggestions or add your own"
            icon={Sparkles}
            accent="violet"
          >
            <ChipPickList
              label="My programming skills"
              options={[...PROGRAMMING_SKILL_OPTIONS]}
              selected={programmingSkills}
              onChange={setProgrammingSkills}
              accentSelected="bg-violet-600/30 border-violet-400 text-violet-100"
              accentRing="ring-violet-400/50"
            />
            <TagSelector
              category="interests"
              selectedTags={interestTags}
              onChange={setInterestTags}
              label="Your interests"
              theme="hackathon"
              required={false}
              allowCreate
              createScope="profile"
            />
            <TagSelector
              category="expertise"
              selectedTags={expertiseTags}
              onChange={setExpertiseTags}
              label="Your expertise"
              theme="hackathon"
              required={false}
              allowCreate
              createScope="profile"
            />
            <TagSelector
              category="techStack"
              selectedTags={techStackTags}
              onChange={setTechStackTags}
              label="Technology stack"
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
          </ProfileSection>

          <ProfileSection
            title="Links & social"
            description="Copied onto project submissions when you save"
            icon={Link2}
            accent="sky"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <CopyableField label="LinkedIn" type="url" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/…" />
              <CopyableField label="GitHub" type="url" value={githubUrl} onChange={setGithubUrl} placeholder="https://github.com/…" />
              <CopyableField label="Personal website" type="url" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://…" />
              <CopyableField label="X (Twitter)" type="url" value={twitterUrl} onChange={setTwitterUrl} placeholder="https://x.com/…" />
              <CopyableField label="Facebook" type="url" value={facebookUrl} onChange={setFacebookUrl} />
              <CopyableField label="Instagram" type="url" value={instagramUrl} onChange={setInstagramUrl} />
            </div>
          </ProfileSection>

          <ProfileSection title="Preferences" description="Teams and event day" icon={Users} accent="amber">
            <CopyableValueBar label="Team preference (idea gallery)" value={teamPrefLabel}>
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
            </CopyableValueBar>

            <CopyableValueBar label="In-person attendance (London)" value={attendanceDisplay}>
              {isAdmin ? (
                <Select value={attendance || undefined} onValueChange={setAttendance}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select (admin planning)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No (remote only)</SelectItem>
                    <SelectItem value="unsure">Not sure yet</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  {eventCheckedIn === null ? (
                    <p className="text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading check-in status…
                    </p>
                  ) : eventCheckedIn ? (
                    <p className="text-emerald-300 font-medium flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Checked in at the event
                    </p>
                  ) : (
                    <p className="text-gray-300">
                      Not checked in yet — on event day enter the room code at{" "}
                      <Link href="/checkin" className="text-violet-300 underline hover:text-violet-200 font-medium">
                        Check-in
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </CopyableValueBar>
          </ProfileSection>
        </div>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl px-4 py-3">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500 min-w-[140px]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
            <Button type="button" variant="ghost" size="lg" asChild className="rounded-xl border border-white/15 text-gray-200 hover:bg-white/10">
              <Link href="/hackathon/ideas">Idea gallery</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              asChild
              className="rounded-xl border border-violet-500/30 bg-violet-950/30 text-violet-100 hover:bg-violet-950/50"
            >
              <Link href="/hackathon/my-projects?project=1">My project</Link>
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

