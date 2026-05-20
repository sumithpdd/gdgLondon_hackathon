"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import {
  formatEventPhotoDateLabel,
  formatEventPhotoUploadedLabel,
} from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import { cn } from "@/lib/utils";

type Props = {
  photos: EventPhoto[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  className?: string;
};

export function EventPhotoCarousel({
  photos,
  activeIndex,
  onActiveIndexChange,
  className,
}: Props) {
  const [paused, setPaused] = useState(false);
  const safeIndex = photos.length ? Math.min(activeIndex, photos.length - 1) : 0;
  const current = photos[safeIndex];

  const go = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      const next = (safeIndex + delta + photos.length) % photos.length;
      onActiveIndexChange(next);
    },
    [photos.length, safeIndex, onActiveIndexChange]
  );

  useEffect(() => {
    if (photos.length === 0 || paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [photos.length, paused, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!current) return null;

  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-fuchsia-950/30 pointer-events-none" />

      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
        <Image
          key={current.id}
          src={current.imageUrl}
          alt={current.caption || current.eventName}
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 80vw"
        />

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-105"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-105"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}

        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white tabular-nums backdrop-blur-sm">
          {safeIndex + 1} / {photos.length}
        </div>
      </div>

      <div className="relative space-y-2 border-t border-white/10 p-4 sm:p-5">
        <p className="text-lg font-semibold text-white">{current.eventName}</p>
        {current.caption ? <p className="text-sm text-gray-300">{current.caption}</p> : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-violet-400" />
            Event: {formatEventPhotoDateLabel(current.eventDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            Uploaded {formatEventPhotoUploadedLabel(current)}
          </span>
        </div>
      </div>

      {photos.length > 1 ? (
        <div className="flex justify-center gap-1.5 pb-4 px-4">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onActiveIndexChange(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === safeIndex ? "w-6 bg-violet-500" : "w-1.5 bg-white/25 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
