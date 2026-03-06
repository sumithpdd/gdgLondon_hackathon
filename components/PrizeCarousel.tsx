"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, ChevronLeft, ChevronRight } from "lucide-react";

const PRIZES = [
  { src: "/Google Pixel 10 a.png", name: "Google Pixel 10a", featured: true },
  { src: "/Google_Ear_buds.png", name: "Google Ear Buds", featured: true },
  { src: "/lego_Lifestyle_art.png", name: "Lego Lifestyle Art" },
  { src: "/Sony_wireless_headphones.png", name: "Sony Wireless Headphones" },
  { src: "/Wireless mechanical gaming keyboard.png", name: "Wireless Mechanical Gaming Keyboard" },
  { src: "/Google_Socks.png", name: "Google Socks" },
  { src: "/Google_bags.png", name: "Google Bags" },
];

const VISIBLE_COUNT = 3;
const MAX_INDEX = Math.max(0, PRIZES.length - VISIBLE_COUNT);

interface PrizeCarouselProps {
  variant?: "compact" | "full";
}

export function PrizeCarousel({ variant = "compact" }: PrizeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i >= MAX_INDEX ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isCompact = variant === "compact";
  const slideOffset = activeIndex * (100 / VISIBLE_COUNT);

  return (
    <section className="w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-amber-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          <Gift className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          Prizes to Be Won
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

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b2e] via-[#251f3a] to-[#1e1b2e] border border-violet-500/30 shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)] p-4 sm:p-5">
        {/* Subtle gradient glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

        {/* Navigation arrows */}
        <button
          onClick={() => setActiveIndex((i) => (i <= 0 ? MAX_INDEX : i - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-violet-600/40 backdrop-blur-sm border border-violet-400/30 hover:bg-violet-500/60 hover:border-violet-400/50 flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:scale-105"
          aria-label="Previous prizes"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveIndex((i) => (i >= MAX_INDEX ? 0 : i + 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-violet-600/40 backdrop-blur-sm border border-violet-400/30 hover:bg-violet-500/60 hover:border-violet-400/50 flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:scale-105"
          aria-label="Next prizes"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="overflow-hidden relative">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${slideOffset}%)` }}
          >
            {PRIZES.map((prize) => {
              const featured = "featured" in prize && prize.featured;
              const maxW = featured
                ? isCompact
                  ? "max-w-[160px] sm:max-w-[200px]"
                  : "max-w-[200px] sm:max-w-[260px]"
                : isCompact
                  ? "max-w-[140px] sm:max-w-[180px]"
                  : "max-w-[180px] sm:max-w-[220px]";
              return (
                <div
                  key={prize.name}
                  className="flex-shrink-0 flex flex-col items-center justify-center px-2 sm:px-3"
                  style={{ width: `${100 / VISIBLE_COUNT}%` }}
                >
                  <div
                    className={`group relative w-full aspect-square ${maxW} mx-auto rounded-xl overflow-hidden transition-all duration-300 ${
                      featured
                        ? "bg-gradient-to-br from-[#2c244c] to-[#3d3560] shadow-[0_0_30px_-8px_rgba(139,92,246,0.4)] ring-1 ring-violet-400/20"
                        : "bg-gradient-to-br from-[#2c244c] to-[#252038] shadow-lg ring-1 ring-white/5"
                    } hover:ring-violet-400/30 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.35)] hover:scale-[1.02]`}
                  >
                    <Image
                      src={prize.src}
                      alt={prize.name}
                      fill
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 220px"
                    />
                  </div>
                  <p className="mt-2.5 font-semibold text-center text-xs sm:text-sm line-clamp-2 text-white">
                    {prize.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: MAX_INDEX + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 w-8 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                  : "bg-white/25 w-2 hover:bg-white/40 hover:w-3"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
