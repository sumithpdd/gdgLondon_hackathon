"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { AttendeeEventPhotoUpload } from "@/components/photos/AttendeeEventPhotoUpload";
import { EventPhotoGallery } from "@/components/photos/EventPhotoGallery";
import { fetchApprovedEventPhotos } from "@/lib/event-photos";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import type { EventPhoto } from "@/types/event-photo";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/AuthContext";

export default function EventPhotosPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuthContext();
  const isAdmin = userProfile?.role === "admin";
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setPhotos(await fetchApprovedEventPhotos());
    } catch {
      toast({ title: "Could not load gallery", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-1 pb-16">
      <header className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center gap-2 text-violet-400">
          <Camera className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Event photos</h1>
        <p className="mx-auto max-w-2xl text-gray-400 text-sm sm:text-base">
          Moments from {HACKATHON_DISPLAY_NAME}. Share your own shots below — the team reviews them
          before they appear in the gallery. Swipe the carousel, filter by event or upload date, and
          tap thumbnails to jump to a photo.
        </p>
        {isAdmin ? (
          <p className="text-xs text-violet-300">
            You can remove unwanted photos from the thumbnail strip, or review pending uploads at{" "}
            <a href="/admin/photos" className="underline">
              Admin → Event photos
            </a>
            .
          </p>
        ) : null}
      </header>

      <AttendeeEventPhotoUpload userId={user?.uid} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
        </div>
      ) : (
        <EventPhotoGallery
          photos={photos}
          canDelete={isAdmin}
          onPhotoDeleted={(id) => {
            setPhotos((prev) => prev.filter((p) => p.id !== id));
            toast({ title: "Photo removed from gallery" });
          }}
        />
      )}
    </div>
  );
}
