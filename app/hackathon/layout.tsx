"use client";

import Link from "next/link";
import Image from "next/image";

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 bg-gradient-to-b from-[#0a0a0f] via-[#0d0a14] to-[#0a0a0f]">
      <header className="bg-[#0d0d14]/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center max-w-6xl">
          <Link href="/hackathon" className="flex items-center gap-4 group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <Image
                src="/gdg-london-logo.png"
                alt="GDG London"
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
              <span className="text-sm font-semibold text-violet-600 hidden sm:inline border-l border-gray-200 pl-4">
                Build with AI × IWD 2026
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-white/10 mt-12 py-10">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center px-4 py-2 rounded-lg bg-white">
            <Image
              src="/gdg-london-logo.png"
              alt="GDG London"
              width={100}
              height={28}
              className="h-6 w-auto object-contain"
            />
          </div>
          <p>Build with AI Hackathon — IWD London 2026</p>
        </div>
      </footer>
    </div>
  );
}
