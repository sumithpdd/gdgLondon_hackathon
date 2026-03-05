"use client";

import { FileText, Square } from "lucide-react";

export default function ResourcesPage() {
  const links = [
    { href: "https://ai.google.dev/docs", label: "Gemini API Docs" },
    { href: "https://aistudio.google.com/", label: "Google AI Studio" },
    { href: "https://adventure.wietsevenema.eu/", label: "Adventure Leaderboard — Test your skills" },
  ];

  return (
    <div className="space-y-0 max-w-3xl mx-auto">
      <section className="rounded-3xl overflow-hidden">
        <div className="p-8 sm:p-12 bg-[#2c244c] border border-violet-500/20 rounded-t-3xl">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 justify-center">
            <div className="flex gap-0.5">
              <Square className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              <Square className="w-3 h-3 fill-amber-500 text-amber-500" />
              <Square className="w-3 h-3 fill-rose-500 text-rose-500" />
            </div>
            Resources
          </h1>
          <p className="text-gray-400 text-center mb-10">
            Explore tools and workshops to help you build with AI
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border-2 border-white/40 bg-transparent text-white font-medium hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="h-24 bg-gradient-to-b from-[#2c244c] to-[#1a1625]" />
      </section>
    </div>
  );
}
