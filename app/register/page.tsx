"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import {
  createOrUpdateUserProfile,
  loginWithGoogle,
  registerWithEmail,
} from "@/lib/auth";
import { firebaseAuthErrorMessage } from "@/lib/firebaseAuthErrors";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const afterAuth = useCallback(() => {
    router.push("/hackathon/profile");
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/hackathon");
    }
  }, [user, loading, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Name is required";
    if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = "Valid email is required";
    if (password.length < 6) e.password = "Min. 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const cred = await loginWithGoogle();
      if (cred) {
        await createOrUpdateUserProfile(cred.user);
        toast({ title: "Welcome!", description: "Your account is ready." });
        afterAuth();
      } else {
        toast({
          title: "Continue in Google",
          description: "Finish sign-in in Google, then you’ll return here.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Google sign-in failed",
        description: firebaseAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await registerWithEmail(email, password, displayName);
      toast({ title: "Account created", description: "Welcome to the hackathon!" });
      afterAuth();
    } catch (err) {
      console.error(err);
      toast({
        title: "Registration failed",
        description: firebaseAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 pl-10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-violet-500"
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex">
      <aside className="hidden md:flex flex-col w-64 bg-[#120a1c] border-r border-white/10 p-8 flex-shrink-0">
        <Link href="/hackathon" className="flex items-center gap-3 mb-10">
          <Image
            src="/gdg-london-logo.png"
            alt="GDG London"
            width={36}
            height={36}
            className="rounded-xl bg-card p-0.5"
          />
          <span className="font-bold text-white text-sm leading-tight">{HACKATHON_DISPLAY_NAME}</span>
        </Link>
        <p className="text-sm text-gray-400 leading-relaxed">
          Join the hackathon hub — browse ideas, form teams, and ship your AI project.
        </p>
        <Link
          href="/hackathon"
          className="mt-auto flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to hackathon
        </Link>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link href="/hackathon" className="flex items-center gap-2">
            <Image src="/gdg-london-logo.png" alt="" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-white text-sm">Register</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-5 sm:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 leading-tight">
            Join the <span className="text-violet-400">hackathon</span>
          </h1>
          <p className="text-gray-400 mb-8 text-sm">Create your account to get started.</p>

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 mb-5 text-sm"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600 font-mono">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <FormField label="Your name" error={errors.displayName}>
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={inputClass(Boolean(errors.displayName))}
              />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass(Boolean(errors.email))}
              />
            </FormField>
            <FormField label="Password" error={errors.password}>
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={`${inputClass(Boolean(errors.password))} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </FormField>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Create account <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/hackathon?login=1" className="text-violet-400 hover:text-violet-300 font-semibold">
              Sign in
            </Link>
            {" · "}
            <Link href="/hackathon?login=1&reset=1" className="text-gray-500 hover:text-violet-300">
              Forgot password?
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">{children}</div>
      {error ? <p className="text-xs text-red-400 mt-1">{error}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
