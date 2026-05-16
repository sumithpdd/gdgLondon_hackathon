"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IWD2026_COLLECTIONS } from "@/lib/hackathon-collections";
import { Button } from "@/components/ui/button";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { Github, ExternalLink, Trophy, ArrowLeft } from "lucide-react";

interface ArchivedProject {
  id: string;
  projectTitle?: string;
  teamName?: string;
  appPurpose?: string;
  githubUrl?: string;
  demoVideoUrl?: string;
  place?: string;
  status?: string;
  label?: string;
  screenshots?: string[];
}

export default function PastProjectsPage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const col = collection(db, IWD2026_COLLECTIONS.projects);
        const snap = await getDocs(col);
        const list: ArchivedProject[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ArchivedProject[];
        list.sort((a, b) => {
          const order = (p: string | undefined) =>
            p === "first" ? 0 : p === "second" ? 1 : p === "third" ? 2 : 99;
          return order(a.place) - order(b.place);
        });
        setProjects(list);
      } catch (e) {
        console.error(e);
        setError("Could not load archived projects. Run the migration script and deploy Firestore rules.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <header className="border-b border-white/10 px-4 py-4 max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/hackathon">
          <Button variant="ghost" className="text-violet-300 hover:text-white gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to hackathon
          </Button>
        </Link>
        <span className="text-sm text-gray-500">{HACKATHON_DISPLAY_NAME}</span>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Past projects &amp; winners</h1>
        <p className="text-gray-400 mb-8">
          IWD 2026 archive — data lives in <code className="text-violet-400">iwd2026Hackathon_projects</code> after migration.
        </p>

        <section id="past-hackathons" className="mb-12 scroll-mt-24">
          <h2 className="text-lg font-semibold text-white mb-2">Past hackathons &amp; side events</h2>
          <p className="text-sm text-gray-500 mb-4">
            Completed activities — links may still work for replays or leaderboards. Promotions (e.g. cloud credits) were
            time-limited to the original dates.
          </p>
          <article className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#1a0a2e]/90 via-[#0f1a0a]/90 to-[#1a0a2e]/90 p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            <div className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden mx-auto sm:mx-0">
              <Image
                src="/garden_adventure.png"
                alt="The Garden of the Forgotten Prompt — archived side event"
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-white">The Garden of the Forgotten Prompt</h3>
              <p className="text-emerald-300 text-sm font-medium mt-1">Adventures await! (archived)</p>
              <p className="text-gray-400 text-sm mt-2">
                Wed 11 March, 11:00 PM — Sat 14 March, 6:00 PM
              </p>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Side adventure alongside Build with AI — GDG London. Players used Google Cloud credits during the live
                window; credit claim and leaderboard perks applied only for that run.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href="https://adventure.wietsevenema.eu/e/gdg-london"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold"
                >
                  Play the adventure <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="https://adventure.wietsevenema.eu/leaderboards/2c6f858e-98ec-438c-857f-671c5eab3c89"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/40 text-emerald-300 text-sm font-medium hover:bg-emerald-500/10"
                >
                  View leaderboard <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </article>
        </section>

        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-amber-400">{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p className="text-gray-500">
            No archived projects yet. Run <code className="text-violet-400">npm run migrate:iwd-archive</code> after configuring Firebase Admin.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-violet-500/20 bg-[#1e1b2e] overflow-hidden flex flex-col"
            >
              {p.screenshots?.[0] && (
                <div className="relative h-40 w-full bg-black/40">
                  <Image src={p.screenshots[0]} alt="" fill className="object-cover" sizes="400px" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-bold text-lg text-white">{p.projectTitle || p.teamName || "Untitled"}</h2>
                  {p.place && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                      <Trophy className="h-3 w-3" />
                      {p.place}
                    </span>
                  )}
                </div>
                <p className="text-sm text-violet-300 mb-2">{p.teamName}</p>
                {p.appPurpose && <p className="text-sm text-gray-400 line-clamp-3 flex-1">{p.appPurpose}</p>}
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.githubUrl && (
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                    >
                      <Github className="h-3 w-3" /> GitHub
                    </a>
                  )}
                  {p.demoVideoUrl && (
                    <a
                      href={p.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Demo
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
