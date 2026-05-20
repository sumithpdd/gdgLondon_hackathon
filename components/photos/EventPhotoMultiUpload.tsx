"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventMediaPreview } from "@/components/photos/EventMediaPreview";
import {
  defaultTitleFromFileName,
  galleryMediaTypeFromFile,
} from "@/lib/event-photos";
import { GALLERY_MEDIA_ACCEPT, MAX_GALLERY_VIDEO_SIZE_MB, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import type { EventGalleryMediaType } from "@/types/event-photo";

export type UploadQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  mediaType: EventGalleryMediaType;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export type GalleryUploadOptions = {
  title?: string;
  mediaType?: EventGalleryMediaType;
};

type Props = {
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
  hint?: string;
  buttonLabel?: string;
  onUpload: (file: File, options?: GalleryUploadOptions) => Promise<void>;
  onComplete?: (results: { ok: number; failed: number }) => void;
};

function isGalleryMediaFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function EventPhotoMultiUpload({
  disabled = false,
  maxFiles,
  accept = GALLERY_MEDIA_ACCEPT,
  hint = `Photos up to ${MAX_FILE_SIZE_MB} MB, videos up to ${MAX_GALLERY_VIDEO_SIZE_MB} MB. Drag and drop or browse.`,
  buttonLabel = "Choose photos & videos",
  onUpload,
  onComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [running, setRunning] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files?.length || disabled) return;
      const list = Array.from(files).filter(isGalleryMediaFile);
      setQueue((prev) => {
        const active = prev.filter((q) => q.status !== "done").length;
        const cap = maxFiles != null ? Math.max(0, maxFiles - active) : list.length;
        const slice = list.slice(0, cap);
        const items: UploadQueueItem[] = slice.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          title: defaultTitleFromFileName(file.name),
          mediaType: galleryMediaTypeFromFile(file),
          status: "queued",
        }));
        return [...prev, ...items];
      });
    },
    [disabled, maxFiles]
  );

  const updateTitle = (id: string, title: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, title } : q)));
  };

  const removeItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  };

  const clearDone = () => {
    setQueue((prev) => {
      prev.filter((q) => q.status === "done").forEach((q) => URL.revokeObjectURL(q.previewUrl));
      return prev.filter((q) => q.status !== "done");
    });
  };

  const runQueue = async () => {
    const pending = queue.filter((q) => q.status === "queued" || q.status === "error");
    if (!pending.length) return;
    setRunning(true);
    let ok = 0;
    let failed = 0;

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", error: undefined } : q))
      );
      try {
        await onUpload(item.file, {
          title: item.title.trim() || defaultTitleFromFileName(item.file.name),
          mediaType: item.mediaType,
        });
        ok += 1;
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q))
        );
      } catch (e) {
        failed += 1;
        const msg = e instanceof Error ? e.message : "Upload failed";
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: msg } : q))
        );
      }
    }

    setRunning(false);
    onComplete?.({ ok, failed });
  };

  const queuedCount = queue.filter((q) => q.status === "queued" || q.status === "error").length;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          dragOver ? "border-violet-400 bg-violet-500/10" : "border-white/20 bg-black/20",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <Upload className="h-10 w-10 mx-auto text-violet-400 mb-3" />
        <p className="text-sm text-gray-300 font-medium">Drop photos or videos here</p>
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="border-white/15 text-white"
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
        {queuedCount > 0 ? (
          <Button
            type="button"
            disabled={disabled || running}
            onClick={() => void runQueue()}
            className="bg-violet-600 hover:bg-violet-500"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload {queuedCount} item{queuedCount === 1 ? "" : "s"}
          </Button>
        ) : null}
        {queue.some((q) => q.status === "done") ? (
          <Button type="button" variant="ghost" size="sm" className="text-gray-400" onClick={clearDone}>
            Clear finished
          </Button>
        ) : null}
      </div>

      {queue.length > 0 ? (
        <ul className="space-y-2">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex flex-col sm:flex-row gap-2 rounded-lg border border-white/10 bg-black/30 p-2 text-xs"
            >
              <div className="relative h-20 w-full sm:h-16 sm:w-24 shrink-0 rounded overflow-hidden bg-black">
                {item.mediaType === "video" ? (
                  <video
                    src={item.previewUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <EventMediaPreview
                    item={{
                      imageUrl: item.previewUrl,
                      mediaType: "image",
                      eventName: item.title,
                    }}
                    variant="thumb"
                    fill
                    sizes="96px"
                    controls={false}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="text-gray-500 block">Rename</label>
                <Input
                  value={item.title}
                  onChange={(e) => updateTitle(item.id, e.target.value)}
                  disabled={item.status === "uploading"}
                  maxLength={120}
                  className="h-8 bg-[#0a0a0f] border-white/15 text-white text-xs"
                />
                <p className="text-gray-500 truncate">
                  {item.file.name} · {item.mediaType === "video" ? "Video" : "Photo"}
                </p>
                <p
                  className={cn(
                    item.status === "done" && "text-emerald-400",
                    item.status === "error" && "text-rose-400",
                    item.status === "uploading" && "text-violet-300",
                    item.status === "queued" && "text-gray-500"
                  )}
                >
                  {item.status === "uploading" && (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </span>
                  )}
                  {item.status === "done" && "Done"}
                  {item.status === "queued" && "Queued"}
                  {item.status === "error" && (item.error || "Failed")}
                </p>
              </div>
              {item.status !== "uploading" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 self-start sm:self-center"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
