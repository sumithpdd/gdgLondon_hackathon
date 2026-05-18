"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminScreenshotGallery({ screenshots }: { screenshots: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!screenshots.length) {
    return <p className="text-sm text-muted-foreground">No screenshots</p>;
  }

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          className="relative h-40 w-full rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition ring-1 ring-border"
          onClick={() => openAt(0)}
        >
          <Image
            src={screenshots[0]}
            alt="Screenshot 1"
            width={480}
            height={320}
            className="w-full h-full object-cover"
          />
          {screenshots.length > 1 ? (
            <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
              {screenshots.length} images
            </Badge>
          ) : null}
        </button>
        {screenshots.length > 1 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {screenshots.map((url, i) => (
              <button
                key={url}
                type="button"
                className="relative h-14 rounded-md overflow-hidden ring-1 ring-border hover:opacity-80"
                onClick={() => openAt(i)}
              >
                <Image src={url} alt={`Screenshot ${i + 1}`} width={80} height={56} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Screenshot {index + 1} of {screenshots.length}
            </DialogTitle>
          </DialogHeader>
          <Image
            src={screenshots[index]}
            alt={`Screenshot ${index + 1}`}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
          />
          {screenshots.length > 1 ? (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIndex((i) => (i > 0 ? i - 1 : screenshots.length - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIndex((i) => (i < screenshots.length - 1 ? i + 1 : 0))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
