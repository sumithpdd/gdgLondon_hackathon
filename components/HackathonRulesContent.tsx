import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Lightbulb, Award, Clock, Users, Ticket, Gift, Shield, Database } from "lucide-react";

export function HackathonRulesContent() {
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground text-center">Rules &amp; requirements</h2>

      <Card className="bg-violet-600/20 border-violet-500/30 text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Ticket className="w-5 h-5 text-violet-400" />
            Event ticket required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>You need a valid ticket for the event to participate in this hackathon.</p>
          <a
            href="https://luma.com/urm40pjn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-semibold underline"
          >
            Get your ticket on Luma (I/O Watch Party + hack night) →
          </a>
        </CardContent>
      </Card>

      <Card className="bg-card border-border text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Event organisers, speakers, and volunteers cannot and will not participate in the hackathon.</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>• Solo builder or Team (max 4 members)</p>
          <p>• Create an idea and allow others to join, or join an existing team with approval</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            Create or join a project idea
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p className="mb-3">When registering your idea, you will provide:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Project Title</li>
            <li>Team Name</li>
            <li>Solo or Group project</li>
            <li>Team members (optional)</li>
            <li>LinkedIn profile</li>
          </ul>
          <p className="mt-3">You can also browse the Idea Gallery and join an existing project.</p>
          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="font-medium text-foreground mb-1">Past side event: &quot;The Garden of the Forgotten Prompt&quot;</p>
            <p className="text-sm text-muted-foreground">
              Ran Wed 11 March — Sat 14 March (2026). Leaderboard perks and cloud-credit promotions were limited to that
              window. Details and links are archived on{" "}
              <Link href="/past-projects#past-hackathons" className="text-primary hover:underline font-medium">
                Past projects
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-amber-400">⚠</span>
          Avoid these project types
        </h3>
        <p className="text-muted-foreground mb-4">
          In the Action Era, if a single prompt can solve it, it&apos;s not an application.
        </p>
        <ul className="space-y-2 text-muted-foreground">
          {avoidTypes.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-rose-400">✕</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-violet-400" />
          What to submit
        </h3>
        <p className="text-muted-foreground mb-6">Each submission must include:</p>
        <div className="space-y-4">
          {submissionItems.map((text, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-foreground/90">{text}</span>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-sm">Optional: Screenshots, design mockups, technical documentation</p>
      </section>

      <section className="p-8 rounded-3xl bg-card border border-border text-left">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-violet-400" />
          Judging criteria
        </h3>
        <ul className="space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">Innovation</strong> — How original or creative is the AI idea?</li>
          <li><strong className="text-foreground">Technical execution &amp; UX</strong> — Is the solution functional, well built, and easy to use?</li>
          <li><strong className="text-foreground">Impact</strong> — Does the project solve a real problem or improve workflows in a meaningful way?</li>
        </ul>
      </section>

      <Card className="bg-amber-500/15 border-2 border-amber-400/50 text-left shadow-[0_0_30px_-8px_rgba(251,191,36,0.3)]">
        <CardHeader>
          <CardTitle className="text-amber-100 flex items-center gap-2 text-xl">
            <Gift className="w-6 h-6 text-amber-400" />
            Winning prizes — important
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-100 font-bold text-lg leading-relaxed">
            🎉 Prizes are handed out live on event day — be there in person to claim your glory.
          </p>
          <p className="text-amber-200/90 font-medium">Show up, win big! No mail, no exceptions. See the current prize pool on the{" "}
            <Link href="/hackathon/prizes" className="underline font-semibold text-amber-50 hover:text-white">
              Prizes
            </Link>{" "}
            page (synced from the database).
          </p>
          <div className="pt-3 border-t border-amber-400/30">
            <p className="text-amber-100 font-semibold">Team projects — prize goes to the project leader</p>
            <p className="text-amber-200/90 text-sm mt-1">
              The prize is awarded to the project leader only. How you share it with your team is entirely up to you — organisers do not decide, influence, or get involved in prize splitting.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-emerald-500/30 text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Your data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Your submission data is stored for <strong className="text-emerald-600 dark:text-emerald-300">30 days</strong> after the event and is <strong className="text-emerald-600 dark:text-emerald-300">not shared</strong> outside the competition.</p>
          <p className="text-sm">We keep it simple: your info stays in-house for judging and event purposes only.</p>
        </CardContent>
      </Card>

      <Card className="bg-violet-600/20 border-violet-500/30 text-left">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Submission deadline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground font-medium">Friday, 13 March 2026 — 23:59</p>
        </CardContent>
      </Card>
    </div>
  );
}
