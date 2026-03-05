"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Lightbulb, Award, Clock, Users } from "lucide-react";

export default function RulesPage() {
  const submissionItems = [
    "A working project",
    "A demo video (max 3 minutes) — Show the app in action and explain what it does.",
    "Project description — Explain the problem, the idea, and how the solution works.",
    "Code repository link (GitHub or similar). If private, provide read access to the judges.",
  ];

  const avoidTypes = [
    "Baseline RAG — Simple data retrieval is now a baseline feature",
    "Prompt-Only Wrappers — System prompts in a basic UI",
    "Simple Vision Analyzers — Basic object identification",
    "Generic Chatbots — Standard bots for nutrition, job screening",
    "Medical Advice — No diagnostic advice projects",
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white text-center">Rules</h1>

      {/* Teams */}
      <Card className="bg-[#2c244c] border-violet-500/20 text-left">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-gray-400">
          <p>• Solo builder or Team (max 4 members)</p>
          <p>• Create an idea and allow others to join, or join an existing team with approval</p>
        </CardContent>
      </Card>

      {/* Create or Join */}
      <Card className="bg-[#2c244c] border-violet-500/20 text-left">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            Create or Join a Project Idea
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-gray-400">
          <p className="mb-3">When registering your idea, you will provide:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Project Title</li>
            <li>Team Name</li>
            <li>Solo or Group project</li>
            <li>Team members (optional)</li>
            <li>LinkedIn profile</li>
          </ul>
          <p className="mt-3">You can also browse the Idea Gallery and join an existing project.</p>
        </CardContent>
      </Card>

      {/* Avoid These Project Types */}
      <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-amber-400">⚠</span>
          Avoid These Project Types
        </h2>
        <p className="text-gray-400 mb-4">
          In the Action Era, if a single prompt can solve it, it&apos;s not an application.
        </p>
        <ul className="space-y-2 text-gray-400">
          {avoidTypes.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-rose-400">✕</span> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* What to Submit */}
      <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-violet-400" />
          What to Submit
        </h2>
        <p className="text-gray-400 mb-6">Each submission must include:</p>
        <div className="space-y-4">
          {submissionItems.map((text, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#1e1b2e] border border-violet-500/10">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-gray-300">{text}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-500 mt-4 text-sm">Optional: Screenshots, design mockups, technical documentation</p>
      </section>

      {/* Judging Criteria */}
      <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-violet-400" />
          Judging Criteria
        </h2>
        <ul className="space-y-2 text-gray-400">
          <li><strong className="text-gray-200">Innovation</strong> — How original or creative is the AI idea?</li>
          <li><strong className="text-gray-200">Technical Execution & User Experience</strong> — Is the solution functional, well built, and easy to use?</li>
          <li><strong className="text-gray-200">Impact</strong> — Does the project solve a real problem or improve user workflows in a meaningful way?</li>
        </ul>
      </section>

      {/* Submission Deadline */}
      <Card className="bg-violet-600/20 border-violet-500/30 text-left">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Submission Deadline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-200 font-medium">Friday, 13 March 2026 — 23:59</p>
        </CardContent>
      </Card>
    </div>
  );
}
