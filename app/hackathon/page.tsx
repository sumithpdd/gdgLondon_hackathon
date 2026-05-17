"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sparkles, Ticket, GitBranch, ArrowRight, Pencil, Eye, Trophy, Award } from "lucide-react";
import { PrizeCarousel } from "@/components/PrizeCarousel";
import { useAuthContext } from "@/lib/AuthContext";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserProject } from "@/lib/join-requests";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION, HACKATHON_EVENT_TAGLINE, HACKATHON_EVENT_SHORT } from "@/lib/constants";
import { getActiveHackathonEvent } from "@/lib/active-hackathon";
import { belongsToActiveHackathon } from "@/lib/hackathon-projects";
import { Submission } from "@/types/submission";
import { getHackathonConfig } from "@/lib/hackathon-config";
import confetti from "canvas-confetti";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date("2026-03-10T09:00:00Z");

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
        <div className="relative bg-card border border-violet-500/30 dark:border-violet-500/30 rounded-2xl px-4 py-5 sm:px-8 sm:py-8 min-w-[80px] sm:min-w-[120px] shadow-sm">
          <span
            className="text-4xl sm:text-7xl font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-foreground to-violet-600 dark:from-white dark:to-violet-200 transition-all duration-300"
          >
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-medium text-muted-foreground mt-3 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

export default function HackathonOverviewPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
  const [mounted, setMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authRedirect, setAuthRedirect] = useState<string | null>(null);
  const [userProject, setUserProject] = useState<Submission | null>(null);
  const [userProjectRole, setUserProjectRole] = useState<"owner" | "member" | null>(null);
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const [activeEventName, setActiveEventName] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUserProject = async () => {
      if (!user) {
        setUserProject(null);
        setUserProjectRole(null);
        return;
      }
      const existing = await getUserProject(user.uid);
      if (existing) {
        setUserProjectRole(existing.role);
        const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, existing.projectId));
        if (projectDoc.exists() && belongsToActiveHackathon(projectDoc.data())) {
          setUserProject({
            id: projectDoc.id,
            ...projectDoc.data(),
            createdAt: projectDoc.data().createdAt?.toDate?.(),
          } as Submission);
        } else {
          setUserProject(null);
          setUserProjectRole(null);
        }
      } else {
        setUserProject(null);
        setUserProjectRole(null);
      }
    };
    fetchUserProject();
  }, [user]);

  useEffect(() => {
    getHackathonConfig().then((config) => setWinnersAnnounced(config.winnersAnnounced));
    getActiveHackathonEvent().then((event) => setActiveEventName(event.displayName));
  }, []);

  // Fire confetti when a winner visits
  useEffect(() => {
    if (winnersAnnounced && userProject?.place && !confettiFired) {
      setConfettiFired(true);
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [winnersAnnounced, userProject, confettiFired]);

  if (!mounted) {
    return null;
  }

  const isOpen =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] page-stack max-w-4xl mx-auto text-center px-2 sm:px-0">
      {/* Badge */}
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/30 text-foreground dark:text-white text-base font-semibold animate-bounce">
        <Rocket className="w-5 h-5" />
        {HACKATHON_EVENT_SHORT.toUpperCase()}
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          <span className="text-foreground">Get Ready to Join the</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Hackathon
          </span>
        </h1>
        <p className="text-muted-foreground text-xl sm:text-2xl leading-relaxed max-w-2xl mx-auto">
          {HACKATHON_EVENT_TAGLINE}
        </p>
        <div className="mt-8 px-8 py-6 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 text-center space-y-2">
          <p className="text-amber-100 font-bold text-lg sm:text-xl">
            🎉 Prizes are handed out live on event day — be there in person to claim your glory.
          </p>
          <p className="text-amber-200/90 text-base font-medium">Show up, win big! No mail, no exceptions.</p>
        </div>
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
            <p className="text-muted-foreground text-base sm:text-lg mb-2">
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

      {/* Prizes carousel - compact */}
      <div className="w-full mt-8">
        <PrizeCarousel variant="compact" />
      </div>

      {/* Your Project (if user has one) or 2 Ways to Participate */}
      {isAuthenticated && userProject ? (
        <section className="content-card border-violet-500/20 text-left w-full">
          {/* Winner banner */}
          {winnersAnnounced && userProject.place && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/40 text-center">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-amber-100 font-bold text-xl">
                Congratulations! You won {userProject.place === "first" ? "1st" : userProject.place === "second" ? "2nd" : "3rd"} Place!
              </p>
              {userProject.projectType === "team" && (
                <p className="text-amber-200/70 text-sm mt-2">
                  If your team has multiple members, it&apos;s up to you to decide how to share the prize among yourselves. The organizers are not involved in prize splitting.
                </p>
              )}
            </div>
          )}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-violet-400 shrink-0" />
            Your Project
          </h2>
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground text-lg">{userProject.projectTitle || userProject.teamName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {userProjectRole === "owner" ? "Project Owner" : "Team Member"} · {userProject.teamName}
                  {(userProject.hackathonName || activeEventName) && (
                    <span className="text-violet-400/90">
                      {" "}
                      · {userProject.hackathonName || activeEventName}
                    </span>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                userProject.status === "submitted"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {userProject.status === "submitted" ? "Submitted" : "Draft"}
              </span>
            </div>
            {userProject.appPurpose && (
              <p className="text-muted-foreground text-sm mt-3 line-clamp-2">{userProject.appPurpose}</p>
            )}
            <div className="flex gap-3 mt-4">
              {userProjectRole === "owner" && userProject.status === "draft" && (
                <Link href={`/hackathon/my-projects?project=1&edit=${userProject.id}`}>
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Draft
                  </Button>
                </Link>
              )}
              {userProject.status === "submitted" && (
                <Link href={`/hackathon/project/${userProject.id}`}>
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                    <Eye className="h-4 w-4 mr-2" />
                    View Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="content-card border-violet-500/20 text-left w-full">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-violet-400 shrink-0" />
            2 Ways to Participate
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="p-7 sm:p-8 rounded-2xl bg-muted/50 border border-border flex flex-col">
              <h3 className="font-bold text-foreground text-lg mb-3">Create a Project</h3>
              <p className="text-muted-foreground text-base leading-relaxed flex-1">
                Submit your hackathon project idea and build something amazing with AI.
              </p>
              {isOpen ? (
                isAuthenticated ? (
                  <Link href="/hackathon/my-projects?project=1" className="mt-4">
                    <Button className="w-full">
                      Create Project
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full mt-4"
                    onClick={() => openSignIn({ redirect: "/hackathon/my-projects?project=1" })}
                  >
                    Sign Up to Create
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ) : (
                <p className="mt-3 text-muted-foreground text-sm">
                  Opens 11th March 2026 at 9:00 AM GMT
                </p>
              )}
            </div>
            <div className="p-7 sm:p-8 rounded-2xl bg-muted/50 border border-border flex flex-col">
              <h3 className="font-bold text-foreground text-lg mb-3">Browse Ideas &amp; Join a Team</h3>
              <p className="text-muted-foreground text-base leading-relaxed flex-1">
                Explore the Idea Gallery and request to join a project that interests you.
              </p>
              {isOpen ? (
                isAuthenticated ? (
                  <Link href="/hackathon/ideas" className="mt-4">
                    <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                      Browse Ideas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => openSignIn({ redirect: "/hackathon/ideas" })}
                  >
                    Sign Up to Browse
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ) : (
                <p className="mt-3 text-muted-foreground text-sm">
                  Opens 11th March 2026 at 9:00 AM GMT
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Ticket requirement */}
      <section className="p-8 rounded-3xl bg-violet-600/20 border border-violet-500/30 text-left w-full mt-8">
        <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-violet-400" />
          Event Ticket Required
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You need a valid ticket for the event to participate in this hackathon.{" "}
          <a
            href="https://luma.com/urm40pjn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 font-semibold underline"
          >
            Get your ticket on Luma (I/O Watch Party + hack night) →
          </a>
        </p>
      </section>

      {/* What is a Hackathon */}
      <section className="p-8 rounded-3xl bg-card border border-violet-500/20 shadow-sm text-left w-full mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" />
          What is a Hackathon?
        </h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Hackathons are events where people come together for a short, intensive period to solve a specific problem or build a functioning prototype—a &quot;<span className="text-violet-400 font-medium">minimum viable product</span>&quot; (MVP)—from scratch.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4 text-lg">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 font-semibold">Build with AI</span> are community-led technical workshops and hackathons hosted by GDGs and GDG on Campus. Use any AI technology—from open models to cloud APIs—to build something real. Google tools like Gemini and AI Studio are optional.
        </p>
      </section>

      {/* Discord */}
      <section className="p-6 rounded-3xl bg-[#5865F2]/15 border border-[#5865F2]/40 text-center w-full mt-8">
        <p className="text-foreground font-bold text-lg mb-1">Got questions? Join the conversation.</p>
        <p className="text-muted-foreground text-sm mb-4">Hackathon Q&amp;A and community support.</p>
        <a
          href="https://discord.gg/EsE9VBTA"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors shadow-lg shadow-[#5865F2]/25"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Join our Discord
        </a>
      </section>

      {/* Contact */}
      <p className="text-center text-muted-foreground text-sm mt-8">
        Having an issue? Let us know at{" "}
        <a href="mailto:hello@gdglondon.dev" className="text-violet-400 hover:text-violet-300 underline">
          hello@gdglondon.dev
        </a>
      </p>
    </div>
  );
}
