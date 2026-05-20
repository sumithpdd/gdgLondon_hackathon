"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EventMediaPreview } from "@/components/photos/EventMediaPreview";
import { getEventPhotoDisplayTitle, isEventPhotoVideo } from "@/lib/event-photos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { getActiveHackathonId } from "@/lib/active-hackathon";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
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
import {
  approveEventPhoto,
  approveEventPhotosBatch,
  backfillLegacyEventPhotosAsApproved,
  deleteEventPhoto,
  fetchEventPhotosForAdmin,
  formatEventPhotoDateLabel,
  formatEventPhotoUploadedLabel,
  isEventPhotoPending,
  isEventPhotoPublished,
  rejectEventPhoto,
  sortEventPhotosByUploaded,
  uploadEventPhoto,
} from "@/lib/event-photos";
import { listHackathons } from "@/lib/hackathons-registry";
import type { EventPhoto } from "@/types/event-photo";
import { MAX_EVENT_PHOTOS_PER_ATTENDEE } from "@/lib/constants";
import { EventPhotoMultiUpload } from "@/components/photos/EventPhotoMultiUpload";
import { EventPhotoGalleryEditor } from "@/components/admin/EventPhotoGalleryEditor";
import { Check, Loader2, Search, Trash2 } from "lucide-react";
import Link from "next/link";

type Props = {
  adminUid: string;
};

export function AdminEventPhotosPanel({ adminUid }: Props) {
  const { toast } = useToast();
  const backfillDone = useRef(false);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventPhoto | null>(null);
  const [hackathonOptions, setHackathonOptions] = useState<{ id: string; label: string }[]>([]);

  const [hackathonId, setHackathonId] = useState(getActiveHackathonId());
  const [eventName, setEventName] = useState(HACKATHON_DISPLAY_NAME);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [caption, setCaption] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!backfillDone.current) {
        backfillDone.current = true;
        const n = await backfillLegacyEventPhotosAsApproved();
        if (n > 0) {
          toast({
            title: "Legacy photos updated",
            description: `${n} older photo${n === 1 ? "" : "s"} marked as approved.`,
          });
        }
      }
      setPhotos(await fetchEventPhotosForAdmin());
    } catch {
      toast({ title: "Could not load photos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await listHackathons();
        setHackathonOptions(
          list.map((h) => ({ id: h.id, label: h.displayName || h.id }))
        );
      } catch {
        setHackathonOptions([{ id: getActiveHackathonId(), label: HACKATHON_DISPLAY_NAME }]);
      }
    })();
  }, []);

  const selectedLabel = useMemo(
    () => hackathonOptions.find((h) => h.id === hackathonId)?.label ?? eventName,
    [hackathonOptions, hackathonId, eventName]
  );

  useEffect(() => {
    if (selectedLabel && !eventName) setEventName(selectedLabel);
  }, [selectedLabel, eventName]);

  const onHackathonChange = (id: string) => {
    setHackathonId(id);
    const label = hackathonOptions.find((h) => h.id === id)?.label;
    if (label) setEventName(label);
  };

  const matchesSearch = useCallback(
    (p: EventPhoto) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.eventName.toLowerCase().includes(q) ||
        (p.caption?.toLowerCase().includes(q) ?? false) ||
        p.uploadedBy.toLowerCase().includes(q)
      );
    },
    [search]
  );

  const pendingPhotos = useMemo(
    () =>
      sortEventPhotosByUploaded(photos.filter((p) => isEventPhotoPending(p) && matchesSearch(p))),
    [photos, matchesSearch]
  );
  const publishedPhotos = useMemo(
    () =>
      sortEventPhotosByUploaded(
        photos.filter((p) => isEventPhotoPublished(p) && matchesSearch(p))
      ),
    [photos, matchesSearch]
  );
  const pendingCount = useMemo(() => photos.filter(isEventPhotoPending).length, [photos]);

  const uploadAdminFile = async (
    file: File,
    options?: { title?: string; mediaType?: "image" | "video" }
  ) => {
    await uploadEventPhoto(
      file,
      {
        hackathonId,
        eventName: eventName.trim() || selectedLabel,
        eventDate,
        caption: caption.trim() || undefined,
        title: options?.title,
        mediaType: options?.mediaType,
      },
      adminUid,
      { publishImmediately: true }
    );
  };

  const togglePendingSelect = (id: string) => {
    setSelectedPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approveSelected = async () => {
    const ids = pendingPhotos.filter((p) => selectedPending.has(p.id) && p.imageUrl).map((p) => p.id);
    if (!ids.length) return;
    setReviewingId("batch");
    try {
      const n = await approveEventPhotosBatch(ids, adminUid);
      setPhotos((prev) =>
        prev.map((p) =>
          ids.includes(p.id) ? { ...p, status: "approved" as const, reviewedBy: adminUid } : p
        )
      );
      setSelectedPending(new Set());
      toast({ title: `${n} photo${n === 1 ? "" : "s"} approved` });
    } catch {
      toast({ title: "Could not approve", variant: "destructive" });
    } finally {
      setReviewingId(null);
    }
  };

  const handleApprove = async (photo: EventPhoto) => {
    setReviewingId(photo.id);
    try {
      await approveEventPhoto(photo.id, adminUid);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id ? { ...p, status: "approved" as const, reviewedBy: adminUid } : p
        )
      );
      toast({ title: "Photo approved", description: "Now visible in the public gallery." });
    } catch {
      toast({ title: "Could not approve", variant: "destructive" });
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (photo: EventPhoto) => {
    setReviewingId(photo.id);
    try {
      await rejectEventPhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast({ title: "Submission declined" });
    } catch {
      toast({ title: "Could not decline", variant: "destructive" });
    } finally {
      setReviewingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteEventPhoto(deleteTarget);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({ title: "Photo removed" });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Could not delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-[#12121a] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Upload event photos</CardTitle>
          <CardDescription className="text-gray-400">
            Admin uploads publish immediately on{" "}
            <Link href="/hackathon/photos" className="text-violet-300 underline">
              Event photos
            </Link>
            . Attendee uploads (max {MAX_EVENT_PHOTOS_PER_ATTENDEE} per person) appear in Pending
            review first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Hackathon edition</Label>
              <Select value={hackathonId} onValueChange={onHackathonChange}>
                <SelectTrigger className="bg-[#0a0a0f] border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hackathonOptions.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Event name (filter label)</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder={HACKATHON_DISPLAY_NAME}
                className="bg-[#0a0a0f] border-white/15 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Event date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-[#0a0a0f] border-white/15 text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-gray-300">Caption (optional, same for batch)</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. Keynote, team demos, swag desk…"
                className="bg-[#0a0a0f] border-white/15 text-white resize-none"
              />
            </div>
          </div>

          <EventPhotoMultiUpload
            disabled={uploading}
            buttonLabel="Add images to queue"
            onUpload={async (file, options) => {
              setUploading(true);
              await uploadAdminFile(file, options);
            }}
            onComplete={({ ok, failed }) => {
              setUploading(false);
              if (ok > 0) {
                toast({
                  title: ok === 1 ? "Photo published" : `${ok} photos published`,
                  description: "Visible on the public gallery.",
                });
                void load();
              }
              if (failed > 0) {
                toast({ title: `${failed} failed`, variant: "destructive" });
              }
            }}
          />
        </CardContent>
      </Card>

      <EventPhotoGalleryEditor photos={photos} onPhotosChange={setPhotos} />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search caption, event, or uploader id…"
          className="pl-9 bg-[#0a0a0f] border-white/15 text-white"
        />
      </div>

      {pendingCount > 0 || loading ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-200">
            Pending review ({pendingCount})
            {loading ? (
              <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-gray-500" />
            ) : null}
          </h2>
          <p className="text-sm text-gray-500">
            Approve to publish, or remove inappropriate submissions (deletes storage and frees the
            attendee&apos;s slot, max {MAX_EVENT_PHOTOS_PER_ATTENDEE} per person).
          </p>
          {selectedPending.size > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={reviewingId === "batch"}
              onClick={() => void approveSelected()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {reviewingId === "batch" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Approve selected ({selectedPending.size})
            </Button>
          ) : null}
          {pendingPhotos.length === 0 && !loading ? null : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden bg-[#0a0a0f] border-amber-500/30">
                  <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/10 bg-black/40">
                    <input
                      type="checkbox"
                      checked={selectedPending.has(photo.id)}
                      onChange={() => togglePendingSelect(photo.id)}
                      className="h-4 w-4 rounded border-white/30"
                      aria-label="Select for bulk approve"
                    />
                    <span className="text-xs text-gray-500">Select</span>
                  </div>
                  <div className="relative aspect-video bg-black/50">
                    {photo.imageUrl ? (
                      <EventMediaPreview item={photo} variant="thumb" fill sizes="33vw" controls={false} />
                    ) : (
                      <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                        Upload incomplete
                      </p>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium text-white truncate">
                      {getEventPhotoDisplayTitle(photo)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isEventPhotoVideo(photo) ? "Video" : "Photo"} ·{" "}
                      {formatEventPhotoDateLabel(photo.eventDate)} ·{" "}
                      {formatEventPhotoUploadedLabel(photo)}
                    </p>
                    <p className="text-xs text-gray-600 font-mono truncate" title={photo.uploadedBy}>
                      Uploader …{photo.uploadedBy.slice(-8)}
                    </p>
                    {photo.caption ? (
                      <p className="text-xs text-gray-400 line-clamp-2">{photo.caption}</p>
                    ) : null}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={reviewingId === photo.id || !photo.imageUrl}
                        onClick={() => void handleApprove(photo)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                      >
                        {reviewingId === photo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reviewingId === photo.id}
                        onClick={() => void handleReject(photo)}
                        className="flex-1 border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Published ({publishedPhotos.length})
          {loading ? (
            <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-gray-500" />
          ) : null}
        </h2>
        {publishedPhotos.length === 0 && !loading ? (
          <p className="text-gray-500 text-sm">No published photos yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden bg-[#0a0a0f] border-white/10">
                <div className="relative aspect-video">
                  <EventMediaPreview item={photo} variant="thumb" fill sizes="33vw" controls={false} />
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm font-medium text-white truncate">
                    {getEventPhotoDisplayTitle(photo)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Event: {formatEventPhotoDateLabel(photo.eventDate)}
                  </p>
                  <p className="text-xs text-cyan-500/90">
                    Uploaded {formatEventPhotoUploadedLabel(photo)}
                  </p>
                  {photo.caption ? (
                    <p className="text-xs text-gray-400 line-clamp-2">{photo.caption}</p>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deletingId === photo.id}
                    onClick={() => setDeleteTarget(photo)}
                    className="mt-2 border-rose-500/40 text-rose-200 hover:bg-rose-500/10 w-full"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove from gallery
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#12121a] border-white/15 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from gallery?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteTarget ? (
                <>
                  Permanently removes this photo from the public gallery and deletes the file.{" "}
                  <span className="text-gray-200">{deleteTarget.eventName}</span>
                  {deleteTarget.caption ? ` — “${deleteTarget.caption}”` : ""}. Uploaded{" "}
                  {formatEventPhotoUploadedLabel(deleteTarget)}.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-rose-600 hover:bg-rose-500"
            >
              {deletingId ? "Removing…" : "Delete photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
