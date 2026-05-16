"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS_COLLECTION, HACKATHON_DISPLAY_NAME, BUDDIES_FEATURE_LABEL } from "@/lib/constants";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProfileCompletion, getExtendedProfileSteps } from "@/lib/profile-completion";
import { countrySelectOptions, resolveCountryForSelect } from "@/lib/countries";
import { ChipPickList } from "@/components/ChipPickList";
import {
  PROGRAMMING_SKILL_OPTIONS,
  DOMAIN_EXPERTISE_OPTIONS,
  WANT_TO_LEARN_OPTIONS,
  CAN_OFFER_OPTIONS,
} from "@/lib/profile-buddy-options";
import { cn } from "@/lib/utils";
import { Loader2, Save, Heart, Check, ArrowRight } from "lucide-react";

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
  const [domainExpertise, setDomainExpertise] = useState<string[]>([]);
  const [wantToLearnTags, setWantToLearnTags] = useState<string[]>([]);
  const [canOfferTags, setCanOfferTags] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [teamPreference, setTeamPreference] = useState("");
  const [attendance, setAttendance] = useState<string>("");
  const [buddiesVisible, setBuddiesVisible] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setProfileDisplayName(userProfile.profileDisplayName ?? userProfile.displayName ?? "");
    setBio(userProfile.hackathonBio ?? "");
    setCity(userProfile.city ?? "");
    setCountry(resolveCountryForSelect(userProfile.country));
    setExperienceLevel(userProfile.experienceLevel ?? "");
    setProgrammingSkills(userProfile.programmingSkills ?? userProfile.skills ?? []);
    setDomainExpertise(userProfile.domainExpertise ?? []);
    setWantToLearnTags(userProfile.wantToLearnTags ?? userProfile.interests ?? []);
    setCanOfferTags(userProfile.canOfferTags ?? []);
    setLinkedin(userProfile.hackathonLinkedinUrl ?? "");
    setGithubUrl(userProfile.githubUrl ?? "");
    setWebsiteUrl(userProfile.websiteUrl ?? "");
    setTeamPreference(userProfile.teamPreference ?? "");
    if (userProfile.inPersonAttendance === true) setAttendance("yes");
    else if (userProfile.inPersonAttendance === false) setAttendance("no");
    else if (userProfile.inPersonAttendance === null) setAttendance("unsure");
    else setAttendance("");
    setBuddiesVisible(!!userProfile.buddiesVisibleInDirectory);
  }, [userProfile]);

  const completion = getProfileCompletion(userProfile);
  const ext = getExtendedProfileSteps({
    ...userProfile,
    profileDisplayName,
    hackathonBio: bio,
    city,
    country,
    experienceLevel: experienceLevel || undefined,
    programmingSkills,
    domainExpertise,
    wantToLearnTags,
    canOfferTags,
    hackathonLinkedinUrl: linkedin,
    githubUrl,
    websiteUrl,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let inPersonAttendance: boolean | null | undefined;
      if (attendance === "yes") inPersonAttendance = true;
      else if (attendance === "no") inPersonAttendance = false;
      else if (attendance === "unsure") inPersonAttendance = null;
      else inPersonAttendance = undefined;

      const draft = {
        profileDisplayName: profileDisplayName.trim() || user.displayName || user.email?.split("@")[0],
        hackathonBio: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        experienceLevel: experienceLevel || undefined,
        programmingSkills,
        domainExpertise,
        wantToLearnTags,
        canOfferTags,
        skills: programmingSkills,
        interests: wantToLearnTags,
        hackathonLinkedinUrl: linkedin.trim(),
        githubUrl: githubUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        teamPreference: teamPreference.trim(),
        buddiesVisibleInDirectory: buddiesVisible,
        ...(attendance === "" ? {} : { inPersonAttendance }),
      };

      const { percent } = getProfileCompletion({
        ...userProfile,
        ...draft,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userProfile?.role ?? "user",
        createdAt: userProfile?.createdAt ?? new Date(),
        updatedAt: userProfile?.updatedAt ?? new Date(),
      });

      const now = new Date();
      await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
        ...draft,
        profileCompletionPercent: percent,
        updatedAt: now,
        updatedBy: user.uid,
        updatedDate: now,
      });

      await refreshProfile();
      toast({ title: "Profile saved", description: `${percent}% team join score · ${ext.done}/${ext.total} profile depth.` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save profile.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "bg-white/5 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-violet-500";

  const countryChoices = useMemo(() => countrySelectOptions(country), [country]);

  const xpBtn = (level: "beginner" | "intermediate" | "advanced", label: string) => (
    <button
      key={level}
      type="button"
      onClick={() => setExperienceLevel(level)}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        experienceLevel === level
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
          : "bg-white/5 border border-white/15 text-gray-300 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto py-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My profile</h1>
          <p className="text-gray-400 text-sm mt-1">Help mentors and other attendees get to know you.</p>
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
            <div className="flex justify-between text-sm text-emerald-100/90 mb-1">
              <span>Profile depth</span>
              <span className="font-semibold text-emerald-300">
                {ext.done}/{ext.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all"
                style={{ width: `${(ext.done / ext.total) * 100}%` }}
              />
            </div>
            {ext.done >= ext.total ? (
              <p className="text-xs text-emerald-200/90 mt-2 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Your extended profile is complete — you&apos;re all set to connect.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-2">Fill city, experience, tags, and links to reach 10/10.</p>
            )}
          </div>
        </div>

        <Card className="bg-emerald-950/15 border-emerald-500/35 text-gray-100">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-400" />
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
                    buddiesVisible ? "bg-emerald-600" : "bg-white/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                      buddiesVisible ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <p className="text-xs text-emerald-200/80">{buddiesVisible ? "Visible in directory" : "Hidden"}</p>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Let other signed-in attendees find you, send requests, and team up. Pair this with the project gallery to
              see what people are building. Changes apply when you tap <strong className="text-gray-200">Save profile</strong>{" "}
              below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-400 border-t border-white/10 pt-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">What others see</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Everyone (signed in): name, bio, LinkedIn, skills, domain expertise, learning tags, what you can offer.</li>
              <li>After they accept a buddy request: GitHub, website, and richer context you choose to share.</li>
            </ul>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-9 rounded-lg border-0 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
            >
              <Link href="/hackathon/buddies" className="inline-flex items-center gap-2">
                Open {BUDDIES_FEATURE_LABEL}
                <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card id="profile-details-start" className="bg-white/5 border-white/10 text-gray-100 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="text-xl text-white">Details</CardTitle>
            <CardDescription className="text-gray-400">
              {HACKATHON_DISPLAY_NAME} — team join score:{" "}
              <span className="font-medium text-violet-300">{completion.percent}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {!completion.complete && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <p className="font-medium mb-1">For idea gallery join requests, also complete:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {completion.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-200">Display name (directory)</Label>
              <Input
                value={profileDisplayName}
                onChange={(e) => setProfileDisplayName(e.target.value)}
                className={fieldClass}
                placeholder="How you want to appear"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-200">
                Bio
              </Label>
              <Textarea
                id="bio"
                rows={5}
                placeholder="Who you are, what you build with AI, what you want from the weekend…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">
                  City <span className="text-red-400">*</span>
                </Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} placeholder="London" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country-select" className="text-gray-200">
                  Country <span className="text-red-400">*</span>
                </Label>
                <Select value={country || undefined} onValueChange={setCountry}>
                  <SelectTrigger id="country-select" className={fieldClass}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] bg-[#1a1625] border-white/10 text-gray-100">
                    {countryChoices.map((name) => (
                      <SelectItem key={name} value={name} className="focus:bg-white/10 focus:text-white">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(city || country) && (
              <p className="text-xs text-emerald-300/90 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {[city, country].filter(Boolean).join(", ")}
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-gray-200">Experience level</Label>
              <div className="flex flex-wrap gap-2">
                {xpBtn("beginner", "Beginner")}
                {xpBtn("intermediate", "Intermediate")}
                {xpBtn("advanced", "Advanced")}
              </div>
            </div>

            <ChipPickList
              label="My programming skills"
              options={[...PROGRAMMING_SKILL_OPTIONS]}
              selected={programmingSkills}
              onChange={setProgrammingSkills}
              accentSelected="bg-violet-600/30 border-violet-400 text-violet-100"
              accentRing="ring-violet-400/50"
            />

            <ChipPickList
              label="My domain expertise"
              options={[...DOMAIN_EXPERTISE_OPTIONS]}
              selected={domainExpertise}
              onChange={setDomainExpertise}
              accentSelected="bg-orange-600/25 border-orange-400 text-orange-100"
              accentRing="ring-orange-400/50"
            />

            <ChipPickList
              label="I want to learn"
              sublabel="Hackathon & AI focus"
              options={[...WANT_TO_LEARN_OPTIONS]}
              selected={wantToLearnTags}
              onChange={setWantToLearnTags}
              accentSelected="bg-emerald-600/25 border-emerald-400 text-emerald-100"
              accentRing="ring-emerald-400/50"
            />

            <ChipPickList
              label="I can offer / help with"
              options={[...CAN_OFFER_OPTIONS]}
              selected={canOfferTags}
              onChange={setCanOfferTags}
              accentSelected="bg-sky-600/25 border-sky-400 text-sky-100"
              accentRing="ring-sky-400/50"
            />

            <div className="grid gap-4 sm:grid-cols-1">
              <div className="space-y-2">
                <Label className="text-gray-200">LinkedIn</Label>
                <Input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">GitHub</Label>
                <Input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Personal website</Label>
                <Input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Team preference (idea gallery)</Label>
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
              <Label className="text-gray-200">In-person attendance (London)</Label>
              <Select value={attendance || undefined} onValueChange={setAttendance}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1625] border-white/10 text-gray-100">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No (remote only)</SelectItem>
                  <SelectItem value="unsure">Not sure yet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="gap-2 rounded-lg bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                asChild
                className="rounded-lg border border-white/25 bg-white/[0.08] px-6 text-base font-medium text-white hover:bg-white/[0.14] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
              >
                <Link href="/hackathon/ideas">Idea gallery</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                asChild
                className="rounded-lg border border-violet-500/35 bg-violet-950/25 px-6 text-base font-medium text-violet-100 hover:bg-violet-950/40 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
              >
                <Link href="/hackathon/my-projects?project=1">My project (draft / submit)</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
