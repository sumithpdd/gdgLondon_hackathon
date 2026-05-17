"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Mail, Lock, ArrowLeft } from "lucide-react";
import { loginWithEmail, loginWithGoogle, sendPasswordResetToEmail } from "@/lib/auth";
import { firebaseAuthErrorMessage } from "@/lib/firebaseAuthErrors";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialView?: "signin" | "forgot";
}

export function AuthModal({ isOpen, onClose, onSuccess, initialView = "signin" }: AuthModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<"signin" | "forgot">("signin");

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setErrors({});
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const inputClass = (hasError: boolean) =>
    `w-full bg-white/5 border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-violet-500"
    }`;

  const validateSignIn = () => {
    const e: Record<string, string> = {};
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) e.email = "Valid email is required";
    if (!form.password.trim()) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateEmailOnly = () => {
    const e: Record<string, string> = {};
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) e.email = "Valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateSignIn()) return;
    setLoading(true);
    try {
      await loginWithEmail(form.email, form.password);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Sign-in failed",
        description: firebaseAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateEmailOnly()) return;
    setResetSending(true);
    try {
      await sendPasswordResetToEmail(form.email);
      toast({
        title: "Check your email",
        description:
          "If an account exists for that address, we sent a link to reset your password.",
      });
      setView("signin");
    } catch (err) {
      toast({
        title: "Could not send reset email",
        description: firebaseAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setResetSending(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await loginWithGoogle();
      if (cred) {
        toast({ title: "Signed in", description: "Welcome back!" });
        onSuccess?.();
        onClose();
        setGoogleLoading(false);
      } else {
        toast({
          title: "Continue in Google",
          description: "Complete sign-in in the Google screen, then you’ll return here.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Google sign-in failed",
        description: firebaseAuthErrorMessage(err),
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <ModalRoot>
      <ModalBackdrop onClose={onClose} />
      <ModalPanel>
        <ModalCorner className="top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl" />
        <ModalCorner className="bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {view === "forgot" ? (
          <>
            <div className="mb-6">
              <p className="font-mono text-xs text-violet-400/60 tracking-widest mb-1">{"// auth.reset"}</p>
              <h2 className="text-2xl font-extrabold text-white">Reset password</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Enter your email and we&apos;ll send a link to set a new password. Google accounts should use
                Continue with Google instead.
              </p>
            </div>
            <form onSubmit={handleSendReset} className="space-y-3">
              <EmailField
                id="reset-email"
                value={form.email}
                onChange={(email) => setForm({ ...form, email })}
                error={errors.email}
                inputClass={inputClass}
              />
              <SubmitButton loading={resetSending} label="Send reset link" loadingLabel="Sending…" />
            </form>
            <button
              type="button"
              onClick={() => {
                setView("signin");
                setErrors({});
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white mt-5 font-mono"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </>
        ) : (
          <>
            <LogoHeader />
            <GoogleButton loading={googleLoading} onClick={() => void handleGoogle()} />
            <OrDivider />
            <form onSubmit={handleSubmit} className="space-y-3">
              <EmailField
                id="email"
                value={form.email}
                onChange={(email) => setForm({ ...form, email })}
                error={errors.email}
                inputClass={inputClass}
              />
              <PasswordField
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                error={errors.password}
                inputClass={inputClass}
                onForgot={() => {
                  setView("forgot");
                  setErrors({});
                }}
              />
              <SubmitButton loading={loading} label="Sign in →" loadingLabel="Signing in…" />
            </form>
            <p className="text-center text-sm text-gray-500 mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/register" onClick={onClose} className="text-violet-400 hover:text-violet-300 font-semibold">
                Register
              </Link>
            </p>
          </>
        )}
      </ModalPanel>
    </ModalRoot>
  );
}

function ModalRoot({ children }: { children: React.ReactNode }) {
  return <Box className="fixed inset-0 z-50 flex items-center justify-center p-4">{children}</Box>;
}


function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return <Box className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />;
}

function ModalPanel({ children }: { children: React.ReactNode }) {
  return (
    <Box className="relative bg-[#120a1c] border border-violet-500/25 rounded-2xl w-full max-w-sm p-8 shadow-2xl shadow-violet-500/10">
      {children}
    </Box>
  );
}

function ModalCorner({ className }: { className: string }) {
  return <Box className={`absolute w-5 h-5 border-violet-500/40 ${className}`} />;
}

function LogoHeader() {
  return (
    <Box className="flex flex-col items-center mb-7">
      <Box className="relative mb-4">
        <Box className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-lg scale-110" />
        <Image
          src="/gdg-london-logo.png"
          alt="GDG London"
          width={68}
          height={68}
          className="relative rounded-2xl ring-1 ring-violet-500/30 bg-card p-1"
        />
      </Box>
        <p className="font-mono text-xs text-violet-400/60 tracking-widest mb-1">{"// auth.login"}</p>
      <h2 className="text-2xl font-extrabold text-white">Welcome back</h2>
      <p className="text-sm text-gray-400 mt-1 text-center">{HACKATHON_DISPLAY_NAME}</p>
    </Box>
  );
}

function EmailField({
  id,
  value,
  onChange,
  error,
  inputClass,
}: {
  id: string;
  value: string;
  onChange: (email: string) => void;
  error?: string;
  inputClass: (hasError: boolean) => string;
}) {
  return (
    <Box className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        Email
      </label>
      <Box className="relative">
        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id={id}
          type="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(Boolean(error))}
        />
      </Box>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </Box>
  );
}

function PasswordField({
  value,
  onChange,
  error,
  inputClass,
  onForgot,
}: {
  value: string;
  onChange: (password: string) => void;
  error?: string;
  inputClass: (hasError: boolean) => string;
  onForgot: () => void;
}) {
  return (
    <Box className="space-y-1.5">
      <Box className="flex items-center justify-between gap-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-violet-400 hover:text-violet-300 font-mono shrink-0"
        >
          Forgot password?
        </button>
      </Box>
      <Box className="relative">
        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(Boolean(error))}
        />
      </Box>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </Box>
  );
}

function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60 mt-2"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 mb-4 text-sm"
    >
      {loading ? <Spinner /> : <GoogleIcon />}
      Continue with Google
    </button>
  );
}

function OrDivider() {
  return (
    <Box className="flex items-center gap-3 mb-4">
      <Box className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-gray-600 font-mono">or email</span>
      <Box className="flex-1 h-px bg-white/10" />
    </Box>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Box({
  className,
  children,
  onClick,
}: {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={className} onClick={onClick} role={onClick ? "presentation" : undefined}>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
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
