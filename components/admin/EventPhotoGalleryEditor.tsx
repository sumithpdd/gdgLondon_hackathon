"use client";

import { useEffect, useMemo, useState } from "react";
import { EventMediaPreview } from "@/components/photos/EventMediaPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteEventPhoto,
  formatEventPhotoDateLabel,
  formatEventPhotoUploadedLabel,
  getEventPhotoDisplayTitle,
  isEventPhotoPublished,
  isEventPhotoVideo,
  saveEventPhotoSortOrders,
  sortEventPhotosForGallery,
  updateEventPhotoMetadata,
} from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type Props = {
  photos: EventPhoto[];
  onPhotosChange: (photos: EventPhoto[]) => void;
};

export function EventPhotoGalleryEditor({ photos, onPhotosChange }: Props) {
  const { toast } = useToast();
  const published = useMemo(
    () => sortEventPhotosForGallery(photos.filter(isEventPhotoPublished)),
    [photos]
  );

  const [order, setOrder] = useState<EventPhoto[]>(published);
  const [dirty, setDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editPhoto, setEditPhoto] = useState<EventPhoto | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setOrder(published);
    setDirty(false);
  }, [published]);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= order.length) return;
    const copy = [...order];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setOrder(copy);
    setDirty(true);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await saveEventPhotoSortOrders(order.map((p) => p.id));
      onPhotosChange(
        photos.map((p) => {
          const idx = order.findIndex((o) => o.id === p.id);
          if (idx === -1) return p;
          return { ...p, sortOrder: idx };
        })
      );
      setDirty(false);
      toast({ title: "Gallery order saved" });
    } catch {
      toast({ title: "Could not save order", variant: "destructive" });
    } finally {
      setSavingOrder(false);
    }
  };

  const openEdit = (photo: EventPhoto) => {
    setEditPhoto(photo);
    setEditTitle(photo.title ?? getEventPhotoDisplayTitle(photo));
    setEditName(photo.eventName);
    setEditDate(photo.eventDate);
    setEditCaption(photo.caption ?? "");
  };

  const saveEdit = async () => {
    if (!editPhoto) return;
    setSavingEdit(true);
    try {
      await updateEventPhotoMetadata(editPhoto.id, {
        title: editTitle,
        eventName: editName,
        eventDate: editDate,
        caption: editCaption,
      });
      const patch = {
        title: editTitle.trim() || undefined,
        eventName: editName.trim(),
        eventDate: editDate,
        caption: editCaption.trim() || undefined,
      };
      onPhotosChange(photos.map((p) => (p.id === editPhoto.id ? { ...p, ...patch } : p)));
      setOrder((prev) => prev.map((p) => (p.id === editPhoto.id ? { ...p, ...patch } : p)));
      toast({ title: "Photo updated" });
      setEditPhoto(null);
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (photo: EventPhoto) => {
    setRemovingId(photo.id);
    try {
      await deleteEventPhoto(photo);
      onPhotosChange(photos.filter((p) => p.id !== photo.id));
      setOrder((prev) => prev.filter((p) => p.id !== photo.id));
      toast({ title: "Removed from gallery" });
    } catch {
      toast({ title: "Could not remove", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  if (published.length === 0) {
    return (
      <Card className="bg-[#12121a] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Gallery editor</CardTitle>
          <CardDescription className="text-gray-400">
            Reorder and edit published photos. Approve pending items first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No published photos yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-[#12121a] border-violet-500/20">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-white">Gallery editor</CardTitle>
            <CardDescription className="text-gray-400">
              Reorder how photos appear on{" "}
              <Link href="/hackathon/photos" className="text-violet-300 underline">
                Event photos
              </Link>
              . Edit captions and event labels. First in the list = first in the carousel.
            </CardDescription>
          </div>
          {dirty ? (
            <Button
              type="button"
              disabled={savingOrder}
              onClick={() => void saveOrder()}
              className="bg-violet-600 hover:bg-violet-500 shrink-0"
            >
              {savingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save order
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {order.map((photo, index) => (
              <li
                key={photo.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2"
              >
                <GripVertical className="h-4 w-4 text-gray-600 shrink-0" aria-hidden />
                <span className="text-xs text-gray-500 w-6 shrink-0 tabular-nums">{index + 1}</span>
                <div className="relative h-12 w-16 shrink-0 rounded overflow-hidden bg-black">
                  <EventMediaPreview
                    item={photo}
                    variant="thumb"
                    fill
                    sizes="64px"
                    controls={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{getEventPhotoDisplayTitle(photo)}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isEventPhotoVideo(photo) ? "Video" : "Photo"} · {photo.eventName} ·{" "}
                    {formatEventPhotoUploadedLabel(photo)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(photo)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-300 hover:text-rose-200"
                    disabled={removingId === photo.id}
                    onClick={() => void remove(photo)}
                    aria-label="Remove"
                  >
                    {removingId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={!!editPhoto} onOpenChange={(open) => !open && setEditPhoto(null)}>
        <DialogContent className="bg-[#12121a] border-white/15 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit gallery item</DialogTitle>
          </DialogHeader>
          {editPhoto ? (
            <div className="space-y-4 py-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <EventMediaPreview item={editPhoto} variant="main" sizes="400px" controls />
              </div>
              <div className="space-y-2">
                <Label>Display name (rename)</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-[#0a0a0f] border-white/15"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Event filter name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#0a0a0f] border-white/15"
                />
              </div>
              <div className="space-y-2">
                <Label>Event date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-[#0a0a0f] border-white/15"
                />
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="bg-[#0a0a0f] border-white/15 resize-none"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="border-white/15" onClick={() => setEditPhoto(null)}>
              Cancel
            </Button>
            <Button
              disabled={savingEdit}
              onClick={() => void saveEdit()}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
