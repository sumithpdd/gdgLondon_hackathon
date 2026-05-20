"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventPhotoMultiUpload } from "@/components/photos/EventPhotoMultiUpload";
import { useToast } from "@/hooks/use-toast";
import { getActiveHackathonId } from "@/lib/active-hackathon";
import { HACKATHON_DISPLAY_NAME, MAX_EVENT_PHOTOS_PER_ATTENDEE } from "@/lib/constants";
import {
  eventPhotoStatusLabel,
  fetchMySubmittedEventPhotos,
  formatEventPhotoUploadedLabel,
  getAttendeeEventPhotoQuota,
  getEventPhotoDisplayTitle,
  uploadAttendeeEventPhoto,
  withdrawEventPhotoById,
} from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import { Loader2, X } from "lucide-react";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { cn } from "@/lib/utils";

type Props = {
  userId: string | undefined;
  eventNameDefault?: string;
};

export function AttendeeEventPhotoUpload({ userId, eventNameDefault = HACKATHON_DISPLAY_NAME }: Props) {
  const { toast } = useToast();
  const { openSignIn } = useHackathonAuth();
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

  const uploadOne = async (
    file: File,
    options?: { title?: string; mediaType?: "image" | "video" }
  ) => {
    if (!userId) {
      openSignIn({ redirect: "/hackathon/photos" });
      throw new Error("Sign in required");
    }
    await uploadAttendeeEventPhoto(
      file,
      {
        hackathonId: getActiveHackathonId(),
        eventName: eventName.trim() || eventNameDefault,
        eventDate,
        caption: caption.trim() || undefined,
        title: options?.title,
        mediaType: options?.mediaType,
      },
      userId
    );
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

  if (!userId) {
    return (
      <Card className="bg-[#12121a] border-violet-500/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Share your photos</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to upload up to {MAX_EVENT_PHOTOS_PER_ATTENDEE} photos for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="bg-violet-600 hover:bg-violet-500"
            onClick={() => openSignIn({ redirect: "/hackathon/photos" })}
          >
            Sign in to upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#12121a] border-violet-500/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Share your photos</CardTitle>
        <CardDescription className="text-gray-400">
          Drag and drop photos or videos (max {MAX_EVENT_PHOTOS_PER_ATTENDEE} per person). Rename
          each item before upload. Reviewed before they appear in the gallery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-gray-300">Event name</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="bg-[#0a0a0f] border-white/15 text-white"
              disabled={!quota.canUpload}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Event date</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-[#0a0a0f] border-white/15 text-white"
              disabled={!quota.canUpload}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-gray-300">Caption (optional, same for batch)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="What’s happening in these shots?"
              className="bg-[#0a0a0f] border-white/15 text-white resize-none"
              disabled={!quota.canUpload}
            />
          </div>
        </div>

        <EventPhotoMultiUpload
          disabled={!quota.canUpload}
          maxFiles={quota.remaining}
          buttonLabel="Add more images"
          hint={`Up to ${quota.remaining} more in this batch. JPG, PNG, GIF, WebP — 10 MB each.`}
          onUpload={uploadOne}
          onComplete={({ ok, failed }) => {
            if (ok > 0) {
              toast({
                title: ok === 1 ? "Photo submitted" : `${ok} photos submitted`,
                description: "An organiser will review before they appear in the gallery.",
              });
              void refreshMine(userId);
            }
            if (failed > 0) {
              toast({
                title: `${failed} upload${failed === 1 ? "" : "s"} failed`,
                variant: "destructive",
              });
            }
          }}
        />

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
                      {getEventPhotoDisplayTitle(p)} · {formatEventPhotoUploadedLabel(p)}
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
      </CardContent>
    </Card>
  );
}
