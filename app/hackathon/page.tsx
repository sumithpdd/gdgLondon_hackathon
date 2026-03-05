"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Clock, Rocket, ExternalLink, Sparkles } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";

export default function HackathonOverviewPage() {
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-white text-sm font-semibold mb-6">
          <Rocket className="w-4 h-4" />
          HACKATHON 2026
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          <span className="text-white">Build with AI • IWD </span>
          <span className="text-gradient">2026</span>
          <br />
          <span className="text-gradient">GDG London</span>
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
          Community-led workshops and hackathons to build with the latest Google AI — Gemini, Vertex AI, AI Studio & more.{" "}
          <span className="text-gradient font-semibold">#BuildwithAI</span>
        </p>

        {/* Info cards */}
        <div className="flex flex-wrap justify-center gap-6 my-12">
          <div className="flex-1 min-w-[140px] max-w-[200px] p-6 rounded-2xl bg-[#1e1b2e] border border-violet-500/20 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-violet-400">100+</p>
            <p className="text-sm text-white mt-1">participants</p>
          </div>
          <div className="flex-1 min-w-[140px] max-w-[200px] p-6 rounded-2xl bg-[#1e1b2e] border border-violet-500/20 text-center flex flex-col items-center justify-center">
            <Clock className="w-6 h-6 text-violet-400 mb-2" />
            <p className="text-2xl sm:text-3xl font-bold text-violet-400">Mar 13</p>
            <p className="text-sm text-white mt-1">deadline</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/submit">
                <Button size="lg" className="bg-gradient-accent hover:opacity-90 text-white border-0 shadow-lg shadow-violet-500/25">
                  <Rocket className="w-4 h-4 mr-2" />
                  Submit Project
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/hackathon/participants">
                <Button size="lg" variant="outline" className="bg-[#1e1b2e]/80 border-violet-500/30 text-white hover:bg-violet-500/20">
                  <Users className="w-4 h-4 mr-2" />
                  Find a Team
                </Button>
              </Link>
              <Link href="/hackathon/gallery">
                <Button size="lg" variant="outline" className="bg-[#1e1b2e]/80 border-violet-500/30 text-white hover:bg-violet-500/20">
                  Project Gallery
                </Button>
              </Link>
            </>
          ) : (
            <Button size="lg" className="bg-gradient-accent hover:opacity-90 text-white border-0" disabled>
              Sign in to submit
            </Button>
          )}
        </div>
      </div>

      {/* What is a Hackathon - fun, reworked */}
      <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" />
          What is a Hackathon?
        </h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          Hackathons are events where people come together for a short, intensive period to solve a specific problem or build a functioning prototype—a &quot;<span className="text-violet-400 font-medium">minimum viable product</span>&quot; (MVP)—from scratch.
        </p>
        <p className="text-gray-300 leading-relaxed mt-4 text-lg">
          <span className="text-gradient font-semibold">Build with AI</span> are community-led technical workshops and hackathons hosted by GDGs and GDG on Campus, designed to introduce the latest Google AI technologies—<span className="text-violet-400">Gemini</span>, <span className="text-violet-400">Vertex AI</span>, <span className="text-violet-400">AI Studio</span>, and <span className="text-violet-400">Antigravity</span>—and empower you to create something real. 🚀
        </p>
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-gray-400 mb-6">Ready to build? Check the <Link href="/hackathon/rules" className="text-violet-400 hover:text-violet-300 font-medium underline">Rules</Link> for full details.</p>
        {isAuthenticated && (
          <Link href="/submit">
            <Button size="lg" className="bg-gradient-accent hover:opacity-90 text-white border-0">
              Submit Your Project
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
