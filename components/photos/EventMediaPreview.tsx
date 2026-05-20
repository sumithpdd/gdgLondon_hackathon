"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import { isEventPhotoVideo, getEventPhotoDisplayTitle } from "@/lib/event-photos";
import type { EventPhoto } from "@/types/event-photo";
import { cn } from "@/lib/utils";

type Props = {
  item: Pick<EventPhoto, "imageUrl" | "mediaType" | "title" | "caption" | "eventName">;
  className?: string;
  /** Thumbnail strip vs main carousel */
  variant?: "thumb" | "main";
  fill?: boolean;
  sizes?: string;
  controls?: boolean;
  autoPlay?: boolean;
};

export function EventMediaPreview({
  item,
  className,
  variant = "main",
  fill = true,
  sizes = "33vw",
  controls = true,
  autoPlay = false,
}: Props) {
  const alt = getEventPhotoDisplayTitle(item as EventPhoto);
  const isVideo = isEventPhotoVideo(item as EventPhoto);

  if (!item.imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-black/50 text-xs text-gray-500",
          className
        )}
      >
        No preview
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={cn("relative bg-black", className)}>
        <video
          src={item.imageUrl}
          className={cn(
            "h-full w-full",
            variant === "main" ? "object-contain" : "object-cover"
          )}
          controls={controls}
          playsInline
          muted={autoPlay}
          autoPlay={autoPlay}
          preload="metadata"
        />
        {variant === "thumb" ? (
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 p-0.5">
            <Film className="h-3 w-3 text-white" aria-hidden />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      src={item.imageUrl}
      alt={alt}
      fill={fill}
      className={cn(variant === "main" ? "object-contain" : "object-cover", className)}
      sizes={sizes}
    />
  );
}
