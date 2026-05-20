"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Clock, Filter, Trash2 } from "lucide-react";
import { EventMediaPreview } from "@/components/photos/EventMediaPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { EventPhotoCarousel } from "@/components/photos/EventPhotoCarousel";
import {
  deleteEventPhoto,
  eventPhotoFilterOptions,
  filterEventPhotos,
  formatEventPhotoDateLabel,
  formatEventPhotoUploadedLabel,
  sortEventPhotosForGallery,
} from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import { cn } from "@/lib/utils";

type Props = {
  photos: EventPhoto[];
  className?: string;
  /** Admins can remove photos from the public gallery. */
  canDelete?: boolean;
  onPhotoDeleted?: (id: string) => void;
};

export function EventPhotoGallery({ photos, className, canDelete = false, onPhotoDeleted }: Props) {
  const [eventName, setEventName] = useState<string>("all");
  const [eventDate, setEventDate] = useState<string>("all");
  const [uploadedDate, setUploadedDate] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<EventPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => sortEventPhotosForGallery(photos), [photos]);
  const { eventNames, eventDates, uploadedDates } = useMemo(
    () => eventPhotoFilterOptions(sorted),
    [sorted]
  );

  const filtered = useMemo(
    () =>
      sortEventPhotosForGallery(
        filterEventPhotos(sorted, { eventName, eventDate, uploadedDate })
      ),
    [sorted, eventName, eventDate, uploadedDate]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [eventName, eventDate, uploadedDate]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEventPhoto(deleteTarget);
      onPhotoDeleted?.(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-white/15 bg-white/5 py-16 text-center",
          className
        )}
      >
        <Camera className="mx-auto h-10 w-10 text-gray-600 mb-3" />
        <p className="text-gray-400">Photos from the event will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="h-4 w-4 shrink-0" />
          Filter gallery
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Event</Label>
            <Select value={eventName} onValueChange={setEventName}>
              <SelectTrigger className="bg-[#0a0a0f] border-white/15 text-white">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {eventNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Event date</Label>
            <Select value={eventDate} onValueChange={setEventDate}>
              <SelectTrigger className="bg-[#0a0a0f] border-white/15 text-white">
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                {eventDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatEventPhotoDateLabel(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Uploaded on
            </Label>
            <Select value={uploadedDate} onValueChange={setUploadedDate}>
              <SelectTrigger className="bg-[#0a0a0f] border-white/15 text-white">
                <SelectValue placeholder="Any upload day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any upload day</SelectItem>
                {uploadedDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatEventPhotoDateLabel(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-500 tabular-nums">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} · gallery order
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No photos match these filters.</p>
      ) : (
        <>
          <EventPhotoCarousel
            photos={filtered}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
          />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              All media
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {filtered.map((photo, i) => (
                <div key={photo.id} className="relative shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "relative block h-20 w-28 overflow-hidden rounded-lg border-2 transition-all sm:h-24 sm:w-32",
                      i === activeIndex
                        ? "border-violet-500 ring-2 ring-violet-500/40"
                        : "border-white/10 opacity-80 hover:opacity-100"
                    )}
                  >
                    <EventMediaPreview
                      item={photo}
                      variant="thumb"
                      fill
                      sizes="128px"
                      controls={false}
                    />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(photo);
                      }}
                      className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-rose-500/50 bg-rose-600 text-white shadow-lg hover:bg-rose-500"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#12121a] border-white/15 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteTarget ? (
                <>
                  <span className="text-gray-200">{deleteTarget.eventName}</span>
                  {deleteTarget.caption ? ` — ${deleteTarget.caption}` : ""}. Uploaded{" "}
                  {formatEventPhotoUploadedLabel(deleteTarget)}. This cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-rose-600 hover:bg-rose-500"
            >
              {deleting ? "Removing…" : "Remove photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
