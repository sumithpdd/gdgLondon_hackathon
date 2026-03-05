"use client";

import { useEffect, useState } from "react";
import { Rocket, Sparkles } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date("2026-03-11T09:00:00Z");

function getTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = Math.max(0, TARGET_DATE.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
        <div className="relative bg-[#1a1528] border border-violet-500/30 rounded-2xl px-4 py-5 sm:px-8 sm:py-8 min-w-[80px] sm:min-w-[120px]">
          <span
            className="text-4xl sm:text-7xl font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-white to-violet-200 transition-all duration-300"
          >
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-400 mt-3 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

export default function HackathonOverviewPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null;
  }

  const isOpen =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 max-w-4xl mx-auto text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-white text-sm font-semibold animate-bounce">
        <Rocket className="w-4 h-4" />
        HACKATHON 2026
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          <span className="text-white">Get Ready to Join the</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Hackathon
          </span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
          Build with AI × IWD 2026 — GDG London
        </p>
      </div>

      {/* Countdown or Open message */}
      {isOpen ? (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white text-2xl sm:text-4xl font-bold shadow-lg shadow-violet-500/30">
            <Sparkles className="w-8 h-8" />
            The Hackathon is Open!
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-gray-300 text-base sm:text-lg mb-2">
              Opens on <span className="text-violet-400 font-semibold">11th March 2026</span> at{" "}
              <span className="text-violet-400 font-semibold">9:00 AM GMT</span>
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <span className="text-3xl sm:text-5xl font-bold text-violet-400 animate-pulse mt-[-1.5rem]">:</span>
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <span className="text-3xl sm:text-5xl font-bold text-violet-400 animate-pulse mt-[-1.5rem]">:</span>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <span className="text-3xl sm:text-5xl font-bold text-violet-400 animate-pulse mt-[-1.5rem]">:</span>
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        </>
      )}

      {/* What is a Hackathon */}
      <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left w-full mt-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" />
          What is a Hackathon?
        </h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          Hackathons are events where people come together for a short, intensive period to solve a specific problem or build a functioning prototype—a &quot;<span className="text-violet-400 font-medium">minimum viable product</span>&quot; (MVP)—from scratch.
        </p>
        <p className="text-gray-300 leading-relaxed mt-4 text-lg">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 font-semibold">Build with AI</span> are community-led technical workshops and hackathons hosted by GDGs and GDG on Campus, designed to introduce the latest Google AI technologies—<span className="text-violet-400">Gemini</span>, <span className="text-violet-400">Vertex AI</span>, <span className="text-violet-400">AI Studio</span>, and <span className="text-violet-400">Antigravity</span>—and empower you to create something real.
        </p>
      </section>
    </div>
  );
}
