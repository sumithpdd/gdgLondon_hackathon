"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = {
  label: string;
  sublabel?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  accentSelected: string;
  accentRing?: string;
};

export function ChipPickList({
  label,
  sublabel,
  options,
  selected,
  onChange,
  accentSelected,
  accentRing = "ring-orange-500/50",
}: Props) {
  const [custom, setCustom] = useState("");

  const addCustom = () => {
    const t = custom.trim();
    if (!t || selected.includes(t)) return;
    onChange([...selected, t]);
    setCustom("");
  };

  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((x) => x !== tag));
    else onChange([...selected, tag]);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const on = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                on
                  ? cn(accentSelected, accentRing, "ring-1")
                  : "border-white/15 bg-white/5 text-gray-300 hover:bg-white/10"
              )}
            >
              {on && <Check className="h-3.5 w-3.5 shrink-0" />}
              {tag}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="+ Add something custom (press Enter)"
          className="bg-white/5 border-white/15 text-white placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
