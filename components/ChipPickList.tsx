"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    if (!t) return;
    const exists = selected.some((s) => s.toLowerCase() === t.toLowerCase());
    if (exists) {
      setCustom("");
      return;
    }
    onChange([...selected, t]);
    setCustom("");
  };

  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((x) => x !== tag));
    else onChange([...selected, tag]);
  };

  const suggestions = options.filter((tag) => !selected.includes(tag));

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {sublabel ? <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p> : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                accentSelected,
                accentRing,
                "ring-1"
              )}
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              {tag}
              <X className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              addCustom();
            }
          }}
          placeholder="+ Add custom (press Enter)"
          className="bg-white/5 border-white/15 text-white placeholder:text-gray-500"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="shrink-0 border-white/20 text-white hover:bg-white/10"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

