"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Link from "next/link";
import { Upload, X, Loader2, Save, Plus, CalendarClock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AI_CATEGORIES,
  BUILT_WITH_OPTIONS,
  FIREBASE_STORAGE_FOLDER,
  HACKATHON_SUBMISSION_DEADLINE,
  HACKATHON_IDEA_SUBMISSION_OPENS,
  HACKATHON_DISPLAY_NAME,
} from "@/lib/constants";
import { ChipPickList } from "@/components/ChipPickList";
import {
  AI_CATEGORY_LABELS,
  RECRUITMENT_TAG_OPTIONS,
  PROJECT_STAGE_LABELS,
} from "@/lib/idea-gallery";
import type { AICategory, ProjectStage } from "@/types/submission";
import { isAfterDeadline, isBeforeIdeaSubmissionOpens } from "@/lib/deadline";
import { getProfileCompletion } from "@/lib/profile-completion";
import {
  buildProjectContactFields,
  findUserProjectForActiveHackathon,
  getOwnedProjectDoc,
  projectCallableError,
  saveProjectDocument,
} from "@/lib/project-submissions";

const fieldClass =
  "bg-white/5 border-white/15 text-white placeholder:text-gray-500 focus-visible:ring-violet-500";

type FormShape = {
  projectTitle: string;
  teamName: string;
  projectType: "solo" | "team";
  demoVideoUrl: string;
  githubUrl: string;
  appPurpose: string;
};

export function ProjectSubmissionForm({ editId }: { editId: string | null }) {
  const { user, userProfile } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<string[]>([]);
  const [pastDeadline, setPastDeadline] = useState(false);
  const [beforeOpens, setBeforeOpens] = useState(false);
  const [lookingForMembers, setLookingForMembers] = useState(false);
  const [pitchLine, setPitchLine] = useState("");
  const [aiCategory, setAiCategory] = useState<AICategory | "">("");
  const [projectStage, setProjectStage] = useState<ProjectStage>("building");
  const [recruitmentTags, setRecruitmentTags] = useState<string[]>([]);
  const [existingStatus, setExistingStatus] = useState<"draft" | "submitted" | null>(null);

  const [formData, setFormData] = useState<FormShape>({
    projectTitle: "",
    teamName: "",
    projectType: "solo",
    demoVideoUrl: "",
    githubUrl: "",
    appPurpose: "",
  });

  const [teamMembers, setTeamMembers] = useState<{ name: string; linkedinUrl: string }[]>([]);
  const [builtWith, setBuiltWith] = useState<string[]>([]);

  const projectToastForId = useRef<string | null>(null);

  useEffect(() => {
    projectToastForId.current = null;
  }, [editId, user?.uid]);

  useEffect(() => {
    setPastDeadline(isAfterDeadline());
    setBeforeOpens(isBeforeIdeaSubmissionOpens());
  }, []);

  useEffect(() => {
    const loadDraft = async () => {
      if (!user) return;

      try {
        let existingRow: { id: string; data: Record<string, unknown> } | null = null;

        if (editId) {
          const owned = await getOwnedProjectDoc(editId, user.uid);
          if (owned) {
            existingRow = { id: owned.id, data: owned.data as Record<string, unknown> };
          }
        }

        if (!existingRow) {
          const found = await findUserProjectForActiveHackathon(user.uid);
          if (found) {
            existingRow = { id: found.id, data: found.data as Record<string, unknown> };
          }
        }

        if (existingRow) {
          const data = existingRow.data;

          setExistingSubmissionId(existingRow.id);
          setExistingScreenshots([]);
          setFormData({
            projectTitle: (data.projectTitle as string) || (data.fullName as string) || "",
            teamName: (data.teamName as string) || (data.fullName as string) || "",
            projectType: (data.projectType as "solo" | "team") || "solo",
            demoVideoUrl: (data.demoVideoUrl as string) || "",
            githubUrl: (data.githubUrl as string) || "",
            appPurpose: (data.appPurpose as string) || "",
          });
          if (data.teamMembers && Array.isArray(data.teamMembers) && data.teamMembers.length > 0) {
            setTeamMembers(
              (data.teamMembers as { name?: string; linkedinUrl?: string }[]).map((m) => ({
                name: m.name || "",
                linkedinUrl: m.linkedinUrl || "",
              }))
            );
          }
          if (data.lookingForMembers !== undefined) {
            setLookingForMembers(!!data.lookingForMembers);
          }
          if (typeof data.pitchLine === "string") setPitchLine(data.pitchLine);
          if (data.aiCategory) setAiCategory(data.aiCategory as AICategory);
          if (data.projectStage) setProjectStage(data.projectStage as ProjectStage);
          if (Array.isArray(data.recruitmentTags)) {
            setRecruitmentTags(data.recruitmentTags as string[]);
          }
          if (data.builtWith && Array.isArray(data.builtWith) && data.builtWith.length > 0) {
            setBuiltWith(data.builtWith as string[]);
          }

          if (data.screenshots && Array.isArray(data.screenshots) && data.screenshots.length > 0) {
            setExistingScreenshots(data.screenshots as string[]);
          }
          if (data.status) {
            setExistingStatus(data.status as "draft" | "submitted");
          }

          const shouldToast = projectToastForId.current !== existingRow.id;
          projectToastForId.current = existingRow.id;
          if (shouldToast) {
            toast({
              title: editId ? "Project loaded" : "Draft loaded",
              description: editId
                ? "Editing your project."
                : "Your previous submission has been loaded. You can continue editing.",
            });
          }
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    };

    if (user) {
      void loadDraft();
    }
  }, [user, toast, editId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + screenshots.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 screenshots",
        variant: "destructive",
      });
      return;
    }

    setScreenshots([...screenshots, ...files]);

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeScreenshot = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    URL.revokeObjectURL(previewUrls[index]);

    setScreenshots(newScreenshots);
    setPreviewUrls(newPreviewUrls);
  };

  const uploadScreenshots = async () => {
    const urls: string[] = [];

    for (const file of screenshots) {
      const storageRef = ref(storage, `${FIREBASE_STORAGE_FOLDER}/${Date.now()}_${file.name}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    return urls;
  };

  const buildGalleryPayload = () => ({
    pitchLine: pitchLine.trim() || undefined,
    aiCategory: aiCategory || undefined,
    projectStage,
    recruitmentTags: recruitmentTags.length > 0 ? recruitmentTags : undefined,
  });

  const saveDraft = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your draft",
        variant: "destructive",
      });
      return;
    }

    if (!user.email?.trim()) {
      toast({
        title: "Email required",
        description: "Your account needs an email address to save a project.",
        variant: "destructive",
      });
      return;
    }

    if (isBeforeIdeaSubmissionOpens()) {
      toast({
        title: "Submissions not open yet",
        description: `You can save drafts from ${HACKATHON_IDEA_SUBMISSION_OPENS.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.`,
        variant: "destructive",
      });
      return;
    }

    if (isAfterDeadline()) {
      toast({
        title: "Submissions closed",
        description: "The final deadline has passed — project edits are frozen.",
        variant: "destructive",
      });
      return;
    }

    setSavingDraft(true);

    try {
      let screenshotUrls = [...existingScreenshots];
      if (screenshots.length > 0) {
        const newUrls = await uploadScreenshots();
        screenshotUrls = [...screenshotUrls, ...newUrls];
      }

      const projectId = await saveProjectDocument({
        ctx: { user, userProfile },
        existingProjectId: existingSubmissionId,
        fields: {
          ...formData,
          ...buildProjectContactFields({ user, userProfile }),
          ...buildGalleryPayload(),
          teamMembers: formData.projectType === "team" ? teamMembers : [],
          builtWith,
          lookingForMembers,
          screenshots: screenshotUrls,
        },
        status: "draft",
        preserveSubmittedStatus: existingStatus === "submitted",
      });
      setExistingSubmissionId(projectId);
      const newStatus = existingStatus === "submitted" ? "submitted" : "draft";

      toast({
        title: "Saved",
        description:
          newStatus === "submitted"
            ? "Your project has been updated."
            : "Your progress has been saved. You can continue later.",
      });

      setExistingScreenshots(screenshotUrls);
      setScreenshots([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    } catch (error: unknown) {
      console.error("Error saving draft:", error);
      const errorMessage = projectCallableError(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your project",
        variant: "destructive",
      });
      return;
    }

    if (!user.email?.trim()) {
      toast({
        title: "Email required",
        description: "Your account needs an email address to submit.",
        variant: "destructive",
      });
      return;
    }

    if (isBeforeIdeaSubmissionOpens()) {
      toast({
        title: "Submissions not open yet",
        description: `Final submissions open ${HACKATHON_IDEA_SUBMISSION_OPENS.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
        variant: "destructive",
      });
      return;
    }

    if (isAfterDeadline()) {
      toast({
        title: "Submissions closed",
        description: "The submission deadline has passed.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.demoVideoUrl?.trim()) {
      toast({
        title: "Demo video required for final submission",
        description: "Add a YouTube demo video link (max 3 min) before locking in.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.githubUrl?.trim()) {
      toast({
        title: "GitHub repo required for final submission",
        description: "Add your code repository link before locking in.",
        variant: "destructive",
      });
      return;
    }

    if (screenshots.length === 0 && existingScreenshots.length === 0) {
      toast({
        title: "Screenshots required",
        description: "Please upload at least one screenshot",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let screenshotUrls = [...existingScreenshots];
      if (screenshots.length > 0) {
        const newUrls = await uploadScreenshots();
        screenshotUrls = [...screenshotUrls, ...newUrls];
      }

      await saveProjectDocument({
        ctx: { user, userProfile },
        existingProjectId: existingSubmissionId,
        fields: {
          ...formData,
          ...buildProjectContactFields({ user, userProfile }),
          ...buildGalleryPayload(),
          teamMembers: formData.projectType === "team" ? teamMembers : [],
          builtWith,
          lookingForMembers,
          screenshots: screenshotUrls,
        },
        status: "submitted",
      });

      toast({
        title: "Success!",
        description: "Your project has been submitted successfully",
      });

      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      router.push("/hackathon/my-projects");
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const err = error as { code?: string; message?: string };
      let description = projectCallableError(error);
      if (err?.code === "storage/unauthorized") {
        description = "Screenshot upload failed — check Storage rules.";
      } else if (err?.code === "permission-denied") {
        description = "Could not save to io2026Hackathon_projects — sign in and try again.";
      }

      toast({
        title: "Submission failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formLocked = beforeOpens || pastDeadline;
  const joinProfileTip =
    userProfile && !getProfileCompletion(userProfile).complete
      ? getProfileCompletion(userProfile).missing
      : null;

  return (
    <Card className="bg-white/5 border-white/10 text-gray-100 shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-xl text-white">Project submission</CardTitle>
            <CardDescription className="text-gray-400">
              {HACKATHON_DISPLAY_NAME}. YouTube and GitHub are optional while you iterate; both are required for final
              submission. Opens{" "}
              {HACKATHON_IDEA_SUBMISSION_OPENS.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · closes{" "}
              {HACKATHON_SUBMISSION_DEADLINE.toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              (London).
            </CardDescription>
          </div>
          <div className="shrink-0 rounded-lg border border-white/10 bg-black/20 p-2">
            <Image
              src="/AI_Innovation_Hub.png"
              alt="AI Innovation Hub"
              width={280}
              height={70}
              className="h-auto w-[min(100%,220px)] rounded-md opacity-95"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {joinProfileTip && joinProfileTip.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Optional: complete your hackathon profile for idea gallery join requests
            </p>
            <ul className="mt-2 list-disc list-inside text-amber-100/90 space-y-0.5">
              {joinProfileTip.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <Link
              href="/hackathon/profile#profile-details-start"
              className="mt-2 inline-block text-amber-200 underline font-medium hover:text-white"
            >
              Open profile details
            </Link>
          </div>
        )}
        {beforeOpens && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/35 flex items-start gap-3">
            <CalendarClock className="h-5 w-5 text-amber-300 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-100">Submissions opening soon</p>
              <p className="text-sm text-amber-100/85">
                The form unlocks at{" "}
                {HACKATHON_IDEA_SUBMISSION_OPENS.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.
                You can still browse the hub in the meantime.
              </p>
            </div>
          </div>
        )}
        {pastDeadline && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/40 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-200">Submissions closed</p>
              <p className="text-sm text-red-200/80">
                The deadline was{" "}
                {HACKATHON_SUBMISSION_DEADLINE.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                . Project edits are frozen; thanks for taking part.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={formLocked} className="space-y-6 min-w-0 border-0 p-0 m-0 disabled:opacity-60">
            <div className="space-y-2">
              <Label htmlFor="projectTitle" className="text-gray-200">
                Project title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="projectTitle"
                placeholder="e.g. AI Event Assistant"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                required
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-gray-200">
                Team name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="teamName"
                placeholder="Your team or solo name"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                required
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Project type <span className="text-red-400">*</span></Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="radio"
                    name="projectType"
                    checked={formData.projectType === "solo"}
                    onChange={() => setFormData({ ...formData, projectType: "solo" })}
                    className="rounded-full border-white/30 bg-white/10"
                  />
                  <span>Solo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="radio"
                    name="projectType"
                    checked={formData.projectType === "team"}
                    onChange={() => setFormData({ ...formData, projectType: "team" })}
                    className="rounded-full border-white/30 bg-white/10"
                  />
                  <span>Team (max 4)</span>
                </label>
              </div>
            </div>

            {formData.projectType === "team" && (
              <div className="space-y-2">
                <Label className="text-gray-200">Team members (optional)</Label>
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Input
                      placeholder="Name"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...teamMembers];
                        next[i] = { ...next[i], name: e.target.value };
                        setTeamMembers(next);
                      }}
                      className={fieldClass}
                    />
                    <Input
                      placeholder="LinkedIn URL"
                      value={m.linkedinUrl}
                      onChange={(e) => {
                        const next = [...teamMembers];
                        next[i] = { ...next[i], linkedinUrl: e.target.value };
                        setTeamMembers(next);
                      }}
                      className={fieldClass}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={() => setTeamMembers(teamMembers.filter((_, j) => j !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                  onClick={() => setTeamMembers([...teamMembers, { name: "", linkedinUrl: "" }])}
                  disabled={teamMembers.length >= 3}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add member
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <input
                  type="checkbox"
                  checked={lookingForMembers}
                  onChange={(e) => setLookingForMembers(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-100">Open to new team members</span>
                  <p className="text-xs text-gray-500">
                    Your project will be visible in the idea gallery for others to request to join
                  </p>
                </div>
              </label>
            </div>

            {lookingForMembers && (
              <div className="space-y-4 rounded-xl border border-pink-500/25 bg-pink-500/[0.06] p-4">
                <p className="text-sm font-medium text-pink-100">Idea gallery appearance</p>
                <p className="text-xs text-gray-500 -mt-2">
                  Shown on <span className="text-gray-400">/hackathon/ideas</span> when recruiting teammates.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="pitchLine" className="text-gray-200">
                    One-line pitch
                  </Label>
                  <Input
                    id="pitchLine"
                    maxLength={120}
                    placeholder="e.g. AI agent for tax filing with SCITT & AAT"
                    value={pitchLine}
                    onChange={(e) => setPitchLine(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {AI_CATEGORIES.map((cat) => (
                      <Badge
                        key={cat}
                        variant={aiCategory === cat ? "default" : "outline"}
                        className={
                          aiCategory === cat
                            ? "cursor-pointer bg-pink-600 hover:bg-pink-500 border-0"
                            : "cursor-pointer border-white/20 text-gray-300 bg-transparent hover:bg-white/10"
                        }
                        onClick={() => setAiCategory(aiCategory === cat ? "" : cat)}
                      >
                        {AI_CATEGORY_LABELS[cat]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Project stage</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROJECT_STAGE_LABELS) as ProjectStage[]).map((stage) => (
                      <Badge
                        key={stage}
                        variant={projectStage === stage ? "default" : "outline"}
                        className={
                          projectStage === stage
                            ? "cursor-pointer bg-white/15 text-white border-white/30"
                            : "cursor-pointer border-white/20 text-gray-400 bg-transparent hover:bg-white/10"
                        }
                        onClick={() => setProjectStage(stage)}
                      >
                        {PROJECT_STAGE_LABELS[stage]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <ChipPickList
                  label="Open asks"
                  sublabel="What you need from collaborators"
                  options={[...RECRUITMENT_TAG_OPTIONS]}
                  selected={recruitmentTags}
                  onChange={setRecruitmentTags}
                  accentSelected="bg-pink-600/90 text-white border-pink-500/50"
                  accentRing="ring-pink-500/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="demoVideoUrl" className="text-gray-200">
                Demo video URL (max 3 min)
              </Label>
              <Input
                id="demoVideoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.demoVideoUrl}
                onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-gray-500">Show your app in action. Required for final submission.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Built with (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {BUILT_WITH_OPTIONS.map((opt) => (
                  <Badge
                    key={opt}
                    variant={builtWith.includes(opt) ? "default" : "outline"}
                    className={
                      builtWith.includes(opt)
                        ? "cursor-pointer bg-violet-600 hover:bg-violet-500 border-0"
                        : "cursor-pointer border-white/20 text-gray-300 bg-transparent hover:bg-white/10"
                    }
                    onClick={() =>
                      setBuiltWith(
                        builtWith.includes(opt) ? builtWith.filter((b) => b !== opt) : [...builtWith, opt]
                      )
                    }
                  >
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUrl" className="text-gray-200">
                GitHub repository URL
              </Label>
              <Input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/username/repo"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-gray-500">Project repo — required for final submission (can differ from profile).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appPurpose" className="text-gray-200">
                App purpose <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="appPurpose"
                placeholder="Tell us about your AI innovation project…"
                value={formData.appPurpose}
                onChange={(e) => setFormData({ ...formData, appPurpose: e.target.value })}
                required
                className={cn(fieldClass, "min-h-[120px]")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshots" className="text-gray-200">
                Screenshots <span className="text-red-400">*</span> (max 5)
              </Label>
              <div className="border-2 border-dashed border-white/15 rounded-lg p-6 bg-white/[0.03]">
                <input id="screenshots" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                <label htmlFor="screenshots" className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-500 mb-2" />
                  <span className="text-gray-300">Click to upload screenshots</span>
                  <span className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB each</span>
                </label>
              </div>

              {existingScreenshots.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Saved screenshots</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingScreenshots.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <Image
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = existingScreenshots.filter((_, i) => i !== index);
                            setExistingScreenshots(next);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">New screenshots</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <Image
                          src={url}
                          alt={`New screenshot ${index + 1}`}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 px-4 py-3 text-sm text-gray-300">
              <p>
                Interests, expertise, tech stack, and social links are on your{" "}
                <Link href="/hackathon/profile" className="text-violet-300 underline hover:text-violet-200">
                  hackathon profile
                </Link>
                . They are copied onto your project when you save.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                type="button"
                onClick={() => void saveDraft()}
                disabled={savingDraft || loading}
                variant="outline"
                className="flex-1 border-white/20 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white"
                size="lg"
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save progress
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={loading || savingDraft || formLocked}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg font-semibold focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Locking in…
                  </>
                ) : beforeOpens ? (
                  "Not open yet"
                ) : pastDeadline ? (
                  "Submissions closed"
                ) : (
                  "Ship it! — Final submission"
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
