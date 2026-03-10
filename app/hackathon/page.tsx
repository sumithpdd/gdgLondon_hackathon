"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sparkles, Ticket, GitBranch, ArrowRight, Pencil, Eye, Trophy, Award, Cloud, ExternalLink, Check } from "lucide-react";
import { PrizeCarousel } from "@/components/PrizeCarousel";
import { useAuthContext } from "@/lib/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserProject } from "@/lib/join-requests";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION, CREDIT_CLAIMS_COLLECTION } from "@/lib/constants";
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
  const [showAuth, setShowAuth] = useState(false);
  const [authRedirect, setAuthRedirect] = useState<string | null>(null);
  const [userProject, setUserProject] = useState<Submission | null>(null);
  const [userProjectRole, setUserProjectRole] = useState<"owner" | "member" | null>(null);
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const [creditClaimed, setCreditClaimed] = useState(false);
  const [claimingCredit, setClaimingCredit] = useState(false);
  const { user, isAuthenticated } = useAuthContext();
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
        if (projectDoc.exists()) {
          setUserProject({ id: projectDoc.id, ...projectDoc.data() } as Submission);
        }
      }
    };
    fetchUserProject();
  }, [user]);

  useEffect(() => {
    getHackathonConfig().then((config) => setWinnersAnnounced(config.winnersAnnounced));
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

  // Check if user already claimed GCP credit
  useEffect(() => {
    if (!user) {
      setCreditClaimed(false);
      return;
    }
    getDoc(doc(db, CREDIT_CLAIMS_COLLECTION, user.uid)).then((snap) => {
      if (snap.exists()) setCreditClaimed(true);
    });
  }, [user]);

  const handleClaimCredit = async () => {
    if (!user || claimingCredit) return;
    setClaimingCredit(true);
    try {
      await setDoc(doc(db, CREDIT_CLAIMS_COLLECTION, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        claimedAt: serverTimestamp(),
      });
      setCreditClaimed(true);
      window.open("https://trygcp.dev/claim/deveco-gdg-80d68f774f1", "_blank");
    } finally {
      setClaimingCredit(false);
    }
  };

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
        <div className="mt-6 px-6 py-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 text-center">
          <p className="text-amber-100 font-bold text-base sm:text-lg">
            🎉 Prizes are handed out live on event day — be there in person to claim your glory.
          </p>
          <p className="text-amber-200/90 text-sm mt-1 font-medium">Show up, win big! No mail, no exceptions.</p>
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

      {/* Prizes carousel - compact */}
      <div className="w-full mt-8">
        <PrizeCarousel variant="compact" />
      </div>

      {/* Your Project (if user has one) or 2 Ways to Participate */}
      {isAuthenticated && userProject ? (
        <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left w-full mt-8">
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
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-violet-400" />
            Your Project
          </h2>
          <div className="p-6 rounded-2xl bg-[#1e1b2e] border border-violet-500/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-lg">{userProject.projectTitle || userProject.teamName}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {userProjectRole === "owner" ? "Project Owner" : "Team Member"} · {userProject.teamName}
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
              <p className="text-gray-400 text-sm mt-3 line-clamp-2">{userProject.appPurpose}</p>
            )}
            <div className="flex gap-3 mt-4">
              {userProjectRole === "owner" && userProject.status === "draft" && (
                <Link href={`/submit?edit=${userProject.id}`}>
                  <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Draft
                  </Button>
                </Link>
              )}
              {userProject.status === "submitted" && (
                <Link href={`/hackathon/project/${userProject.id}`}>
                  <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                    <Eye className="h-4 w-4 mr-2" />
                    View Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="p-8 rounded-3xl bg-[#2c244c] border border-violet-500/20 text-left w-full mt-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-violet-400" />
            2 Ways to Participate
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#1e1b2e] border border-violet-500/10 flex flex-col">
              <h3 className="font-bold text-white mb-2">Create a Project</h3>
              <p className="text-gray-400 text-sm flex-1">
                Submit your hackathon project idea and build something amazing with AI.
              </p>
              {isOpen ? (
                isAuthenticated ? (
                  <Link href="/submit" className="mt-4">
                    <Button className="w-full bg-violet-600 hover:bg-violet-500">
                      Create Project
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full mt-4 bg-violet-600 hover:bg-violet-500"
                    onClick={() => {
                      setAuthRedirect("/submit");
                      setShowAuth(true);
                    }}
                  >
                    Sign Up to Create
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ) : (
                <p className="mt-3 text-gray-500 text-sm">
                  Opens 11th March 2026 at 9:00 AM GMT
                </p>
              )}
            </div>
            <div className="p-6 rounded-2xl bg-[#1e1b2e] border border-violet-500/10 flex flex-col">
              <h3 className="font-bold text-white mb-2">Browse Ideas &amp; Join a Team</h3>
              <p className="text-gray-400 text-sm flex-1">
                Explore the Idea Gallery and request to join a project that interests you.
              </p>
              {isOpen ? (
                isAuthenticated ? (
                  <Link href="/hackathon/ideas" className="mt-4">
                    <Button variant="outline" className="w-full border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                      Browse Ideas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                    onClick={() => {
                      setAuthRedirect("/hackathon/ideas");
                      setShowAuth(true);
                    }}
                  >
                    Sign Up to Browse
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ) : (
                <p className="mt-3 text-gray-500 text-sm">
                  Opens 11th March 2026 at 9:00 AM GMT
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false);
          setAuthRedirect(null);
        }}
        onSuccess={() => {
          if (authRedirect) {
            router.push(authRedirect);
          }
        }}
      />

      {/* Ticket requirement */}
      <section className="p-8 rounded-3xl bg-violet-600/20 border border-violet-500/30 text-left w-full mt-8">
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-violet-400" />
          Event Ticket Required
        </h2>
        <p className="text-gray-300 leading-relaxed">
          You need a valid ticket for the event to participate in this hackathon.{" "}
          <a
            href="https://buildwithai.gdg.london/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 font-semibold underline"
          >
            Get your ticket at buildwithai.gdg.london →
          </a>
        </p>
      </section>

      {/* GCP Credits - only for signed-in users */}
      {isAuthenticated && (
        <section className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 via-[#1e1b2e] to-cyan-600/20 border border-blue-500/30 text-left w-full mt-8">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-400" />
            Google Cloud Credits
          </h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Join the adventure <span className="text-blue-400 font-semibold">&quot;Garden of Forgotten Prompts&quot;</span> — to play, you&apos;ll need Google Cloud credits. Use the link below to claim yours.
          </p>
          <p className="text-gray-300 leading-relaxed mb-3">
            We will provide you cloud credits and will open it on the 11th. You will need to create a project so that we can send you credits.
          </p>
          <p className="text-blue-300 text-sm font-medium mb-5">
            Opens 11th March 2026 at 9:00 AM GMT
          </p>
          {creditClaimed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold">
              <Check className="w-4 h-4" />
              Credit claimed
            </div>
          ) : (
            <Button
              onClick={handleClaimCredit}
              disabled={claimingCredit}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {claimingCredit ? "Claiming..." : "Claim Your GCP Credit"}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </section>
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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 font-semibold">Build with AI</span> are community-led technical workshops and hackathons hosted by GDGs and GDG on Campus. Use any AI technology—from open models to cloud APIs—to build something real. Google tools like Gemini and AI Studio are optional.
        </p>
      </section>
    </div>
  );
}
