import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Register for {HACKATHON_DISPLAY_NAME}</h1>
        <p className="text-gray-400 mb-8">
          We use Firebase Auth — create an account or sign in with Google from the main site. After signing in,
          complete your hackathon profile so teams can discover you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500">
            <Link href="/hackathon">Go to hackathon hub</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/hackathon/profile">Complete profile</Link>
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-10">
          Short URLs: <code className="text-violet-400">/ideas</code> redirects to the idea gallery.{" "}
          <code className="text-violet-400">/ideas/create</code> goes to project submission.
        </p>
      </main>
    </div>
  );
}
