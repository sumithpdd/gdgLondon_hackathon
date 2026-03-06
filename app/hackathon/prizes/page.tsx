"use client";

import { PrizeCarousel } from "@/components/PrizeCarousel";

export default function PrizesPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Prizes to Be Won</h1>
        <p className="text-gray-400">
          Build something amazing — these prizes await the best projects. Show up on event day to claim yours!
        </p>
      </div>

      <PrizeCarousel variant="full" />

      <div className="p-8 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 text-center">
        <p className="text-amber-100 font-bold text-lg sm:text-xl">
          🎉 Prizes are handed out live on event day — be there in person to claim your glory.
        </p>
        <p className="text-amber-200/90 text-sm sm:text-base mt-2 font-medium">Show up, win big! No mail, no exceptions.</p>
      </div>
    </div>
  );
}
