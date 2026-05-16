"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPrizesFromSettings, type HackathonPrizeEntry, DEFAULT_IO2026_PRIZES } from "@/lib/prizes";

const VISIBLE_COUNT = 3;

interface PrizeCarouselProps {
  variant?: "compact" | "full";
}

export function PrizeCarousel({ variant = "compact" }: PrizeCarouselProps) {
  const [prizes, setPrizes] = useState<HackathonPrizeEntry[]>(DEFAULT_IO2026_PRIZES);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchPrizesFromSettings().then((p) => {
      if (!cancelled && p.length) setPrizes(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = Math.min(VISIBLE_COUNT, Math.max(1, prizes.length));
  const maxIndex = Math.max(0, prizes.length - visible);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [maxIndex]);

  const isCompact = variant === "compact";
  const slideOffset = activeIndex * (100 / visible);

  return (
    <section className="w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-amber-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          <Gift className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          Prizes to be won
        </h2>
        {isCompact && (
          <Link
            href="/hackathon/prizes"
            className="text-sm font-medium bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hover:from-violet-300 hover:to-fuchsia-300 transition-all"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-muted/30 to-card border border-border shadow-sm p-4 sm:p-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

        <button
          type="button"
          onClick={() => setActiveIndex((i) => (i <= 0 ? maxIndex : i - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-primary/20 backdrop-blur-sm border border-border hover:bg-primary/30 flex items-center justify-center text-primary-foreground transition-all duration-300 shadow-lg hover:scale-105"
          aria-label="Previous prizes"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-primary/20 backdrop-blur-sm border border-border hover:bg-primary/30 flex items-center justify-center text-primary-foreground transition-all duration-300 shadow-lg hover:scale-105"
          aria-label="Next prizes"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="overflow-hidden relative">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${slideOffset}%)` }}
          >
            {prizes.map((prize) => {
              const featured = Boolean(prize.featured);
              const maxW = featured
                ? isCompact
                  ? "max-w-[160px] sm:max-w-[200px]"
                  : "max-w-[200px] sm:max-w-[260px]"
                : isCompact
                  ? "max-w-[140px] sm:max-w-[180px]"
                  : "max-w-[180px] sm:max-w-[220px]";
              return (
                <div
                  key={prize.id}
                  className="flex-shrink-0 flex flex-col items-center justify-center px-2 sm:px-3"
                  style={{ width: `${100 / visible}%` }}
                >
                  <div
                    className={`group relative w-full aspect-square ${maxW} mx-auto rounded-xl overflow-hidden transition-all duration-300 ${
                      featured
                        ? "bg-gradient-to-br from-violet-950/40 to-fuchsia-950/30 shadow-md ring-1 ring-primary/25"
                        : "bg-muted/40 shadow-md ring-1 ring-border"
                    } hover:ring-primary/30 hover:scale-[1.02]`}
                  >
                    <Image
                      src={prize.imageSrc}
                      alt={prize.name}
                      fill
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 220px"
                    />
                  </div>
                  <p className="mt-2.5 font-semibold text-center text-xs sm:text-sm line-clamp-2 text-foreground">
                    {prize.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 w-8 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                  : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50 hover:w-3"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
