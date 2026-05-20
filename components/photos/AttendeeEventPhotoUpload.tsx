"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getActiveHackathonId } from "@/lib/active-hackathon";
import { HACKATHON_DISPLAY_NAME, MAX_EVENT_PHOTOS_PER_ATTENDEE } from "@/lib/constants";
import {
  eventPhotoStatusLabel,
  fetchMySubmittedEventPhotos,
  formatEventPhotoUploadedLabel,
  getAttendeeEventPhotoQuota,
  uploadAttendeeEventPhoto,
  withdrawEventPhotoById,
} from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { cn } from "@/lib/utils";

type Props = {
  userId: string | undefined;
  eventNameDefault?: string;
};

export function AttendeeEventPhotoUpload({ userId, eventNameDefault = HACKATHON_DISPLAY_NAME }: Props) {
  const { toast } = useToast();
  const { openSignIn } = useHackathonAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [loadingMine, setLoadingMine] = useState(false);
  const [mine, setMine] = useState<EventPhoto[]>([]);
  const [eventName, setEventName] = useState(eventNameDefault);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [caption, setCaption] = useState("");

  const quota = useMemo(() => getAttendeeEventPhotoQuota(mine), [mine]);

  const refreshMine = useCallback(async (uid: string) => {
    setLoadingMine(true);
    try {
      setMine(await fetchMySubmittedEventPhotos(uid));
    } catch {
      setMine([]);
    } finally {
      setLoadingMine(false);
    }
  }, []);

  useEffect(() => {
    if (userId) void refreshMine(userId);
  }, [userId, refreshMine]);

  const handleChoose = () => {
    if (!userId) {
      openSignIn({ redirect: "/hackathon/photos" });
      return;
    }
    if (!quota.canUpload) {
      toast({
        title: "Photo limit reached",
        description: `You can have at most ${MAX_EVENT_PHOTOS_PER_ATTENDEE} photos. Withdraw a pending submission to free a slot.`,
        variant: "destructive",
      });
      return;
    }
    fileRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return;

    const batch = Array.from(files).slice(0, quota.remaining);
    if (batch.length < files.length) {
      toast({
        title: "Some files skipped",
        description: `Only ${quota.remaining} slot${quota.remaining === 1 ? "" : "s"} left (max ${MAX_EVENT_PHOTOS_PER_ATTENDEE}).`,
      });
    }

    setUploading(true);
    try {
      let count = 0;
      for (const file of batch) {
        await uploadAttendeeEventPhoto(
          file,
          {
            hackathonId: getActiveHackathonId(),
            eventName: eventName.trim() || eventNameDefault,
            eventDate,
            caption: caption.trim() || undefined,
          },
          userId
        );
        count += 1;
      }
      toast({
        title: count === 1 ? "Photo submitted" : `${count} photos submitted`,
        description: "An organiser will review before it appears in the gallery.",
      });
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      await refreshMine(userId);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleWithdraw = async (photo: EventPhoto) => {
    if (!userId || photo.status !== "pending") return;
    setWithdrawingId(photo.id);
    try {
      await withdrawEventPhotoById(photo.id);
      toast({ title: "Submission withdrawn" });
      await refreshMine(userId);
    } catch {
      toast({ title: "Could not withdraw", variant: "destructive" });
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <Card className="bg-[#12121a] border-violet-500/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Share your photos</CardTitle>
        <CardDescription className="text-gray-400">
          Upload moments from the event (max {MAX_EVENT_PHOTOS_PER_ATTENDEE} photos per person,
          including pending). The team reviews submissions before they appear in the gallery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userId ? (
          <p className="text-sm text-violet-200/90">
            Your slots:{" "}
            <span className="font-semibold text-white">
              {quota.used} / {quota.max}
            </span>
            {quota.remaining > 0 ? (
              <span className="text-gray-400"> · {quota.remaining} remaining</span>
            ) : (
              <span className="text-amber-300"> · limit reached</span>
            )}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-gray-300">Event name</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="bg-[#0a0a0f] border-white/15 text-white"
              disabled={!userId || !quota.canUpload}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Event date</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-[#0a0a0f] border-white/15 text-white"
              disabled={!userId || !quota.canUpload}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-gray-300">Caption (optional)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="What’s happening in this shot?"
              className="bg-[#0a0a0f] border-white/15 text-white resize-none"
              disabled={!userId || !quota.canUpload}
            />
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          type="button"
          disabled={uploading || (!!userId && !quota.canUpload)}
          onClick={handleChoose}
          className="bg-violet-600 hover:bg-violet-500 w-full sm:w-auto"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ImagePlus className="h-4 w-4 mr-2" />
          )}
          {!userId
            ? "Sign in to upload"
            : uploading
              ? "Uploading…"
              : quota.canUpload
                ? "Choose photos to submit"
                : "Photo limit reached"}
        </Button>

        {userId ? (
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-300">Your submissions</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-violet-300 hover:text-white h-8"
                onClick={() => void refreshMine(userId)}
              >
                Refresh
              </Button>
            </div>
            {loadingMine ? (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </p>
            ) : mine.length === 0 ? (
              <p className="text-xs text-gray-500">No uploads yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {mine.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
                  >
                    <span className="text-gray-300 truncate flex-1 min-w-0">
                      {p.caption || p.eventName} · {formatEventPhotoUploadedLabel(p)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 font-medium",
                        p.status === "pending"
                          ? "bg-amber-500/20 text-amber-200"
                          : p.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {eventPhotoStatusLabel(p)}
                    </span>
                    {p.status === "pending" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-gray-400 hover:text-rose-300"
                        disabled={withdrawingId === p.id}
                        aria-label="Withdraw submission"
                        onClick={() => void handleWithdraw(p)}
                      >
                        {withdrawingId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
