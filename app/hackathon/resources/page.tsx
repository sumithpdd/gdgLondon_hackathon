"use client";

import Image from "next/image";
import { FileText, Square, ExternalLink } from "lucide-react";

export default function ResourcesPage() {
  const links = [
    { href: "https://huggingface.co/docs", label: "Hugging Face Docs" },
    { href: "https://platform.openai.com/docs", label: "OpenAI API Docs" },
    { href: "https://ai.google.dev/docs", label: "Gemini API Docs" },
    { href: "https://aistudio.google.com/", label: "AI Studio" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
            Explore tools and APIs to help you build with AI — use any AI technology you prefer
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

          {/* Discord */}
          <div className="mt-10 pt-8 border-t border-white/10 text-center">
            <p className="text-white font-bold text-lg mb-1">Need help? Have questions?</p>
            <p className="text-gray-400 text-sm mb-4">Hackathon Q&A, the adventure, cloud credits — join the Discord.</p>
            <a
              href="https://discord.com/invite/QujDVuNJ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors shadow-lg shadow-[#5865F2]/25"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              Join our Discord
            </a>
          </div>
        </div>
        <div className="h-24 bg-gradient-to-b from-[#2c244c] to-[#1a1625]" />
      </section>

      {/* Adventure Workshop */}
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#0f1a0a] to-[#1a0a2e] border border-emerald-500/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-xl overflow-hidden">
            <Image
              src="/garden_adventure.png"
              alt="The Garden of the Forgotten Prompt"
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white mb-1">The Garden of the Forgotten Prompt</h2>
            <p className="text-emerald-300 text-sm font-medium">BUILD WITH AI — GDG London</p>
            <p className="text-gray-400 text-sm mt-2">
              Wed 11 March, 11:00 PM — Sat 14 March, 6:00 PM
            </p>
            <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
              <a
                href="https://adventure.wietsevenema.eu/e/gdg-london"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-lg shadow-emerald-600/25 text-sm"
              >
                Play the Adventure
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://adventure.wietsevenema.eu/leaderboards/2c6f858e-98ec-438c-857f-671c5eab3c89"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-300 font-medium hover:bg-emerald-500/10 transition-colors text-sm"
              >
                View Leaderboard
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
