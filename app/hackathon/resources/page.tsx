import Link from "next/link";
import { FileText, Square } from "lucide-react";
import { HackathonRulesContent } from "@/components/HackathonRulesContent";

export default function ResourcesAndRulesPage() {
  const links = [
    { href: "https://huggingface.co/docs", label: "Hugging Face Docs" },
    { href: "https://platform.openai.com/docs", label: "OpenAI API Docs" },
    { href: "https://ai.google.dev/docs", label: "Gemini API Docs" },
    { href: "https://aistudio.google.com/", label: "AI Studio" },
  ];

  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      <section className="rounded-3xl overflow-hidden">
        <div className="p-8 sm:p-12 bg-card border border-border rounded-t-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3 justify-center">
            <div className="flex gap-0.5">
              <Square className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              <Square className="w-3 h-3 fill-amber-500 text-amber-500" />
              <Square className="w-3 h-3 fill-rose-500 text-rose-500" />
            </div>
            Resources &amp; learning
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Explore tools and APIs to help you build with AI — use any AI technology you prefer
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border-2 border-border bg-muted/30 text-foreground font-medium hover:bg-accent transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border text-center">
            <p className="text-foreground font-bold text-lg mb-1">Need help? Have questions?</p>
            <p className="text-muted-foreground text-sm mb-4">Hackathon Q&amp;A and community support — join the Discord.</p>
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
        <div className="h-12 bg-gradient-to-b from-card to-background" />
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Past side events (e.g. <strong className="text-foreground">Garden of the Forgotten Prompt</strong>) are archived on{" "}
        <Link href="/past-projects#past-hackathons" className="text-primary hover:underline">
          Past projects
        </Link>
        .
      </p>

      <div id="rules" className="scroll-mt-28">
        <HackathonRulesContent />
      </div>
    </div>
  );
}
