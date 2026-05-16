"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type CopyableFieldProps = {
  label: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: string;
  id?: string;
  hint?: string;
  inputClassName?: string;
};

export function CopyableField({
  label,
  value,
  onChange,
  readOnly = false,
  multiline = false,
  rows = 4,
  placeholder,
  type = "text",
  id,
  hint,
  inputClassName,
}: CopyableFieldProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const text = value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }, [value, toast]);

  const baseInputClass = cn(
    "bg-white/5 border-white/15 text-white placeholder:text-gray-500",
    "focus-visible:ring-violet-500/80 focus-visible:border-violet-500/40",
    "transition-colors",
    multiline ? "pr-12 pb-10 resize-y min-h-[100px]" : "pr-11",
    readOnly && "opacity-90 cursor-default",
    inputClassName
  );

  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-gray-200 font-medium">
          {label}
        </Label>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!value.trim()}
          title={value.trim() ? "Copy to clipboard" : "Nothing to copy"}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
            value.trim()
              ? "text-violet-300 hover:bg-violet-500/15 hover:text-violet-200"
              : "text-gray-600 cursor-not-allowed"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        {multiline ? (
          <Textarea
            id={id}
            rows={rows}
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={readOnly}
            placeholder={placeholder}
            className={baseInputClass}
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={readOnly}
            placeholder={placeholder}
            className={baseInputClass}
          />
        )}
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!value.trim()}
          aria-label="Copy field value"
          className={cn(
            "absolute right-2 rounded-md p-1.5 transition-all",
            multiline ? "bottom-2" : "top-1/2 -translate-y-1/2",
            value.trim()
              ? "text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
              : "text-gray-700 cursor-not-allowed opacity-40"
          )}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

/** Copy button + label for selects or custom read-only blocks */
export function CopyableValueBar({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Copied to clipboard." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-gray-200 font-medium">{label}</Label>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!value.trim()}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
            value.trim()
              ? "text-violet-300 hover:bg-violet-500/15"
              : "text-gray-600 cursor-not-allowed"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      {children}
    </div>
  );
}
