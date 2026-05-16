"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

export default function VotePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <header className="border-b border-white/10 px-4 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/hackathon">
          <Button variant="ghost" className="text-violet-300 hover:text-white gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <span className="text-sm text-gray-500">Voting</span>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-3">Audience voting</h1>
        <p className="text-gray-400 mb-6">
          {HACKATHON_DISPLAY_NAME} will use checked-in attendance, a live code from admins, and a cap of{" "}
          <strong className="text-gray-200">five votes per person</strong> across projects. Enforcement belongs in
          Cloud Functions; this route will host the voting UI once the backend is wired.
        </p>
        <p className="text-sm text-gray-500">
          Spec: <code className="text-violet-400">docs/IO2026_HACKATHON_SPEC.md</code> §8.
        </p>
      </main>
    </div>
  );
}
