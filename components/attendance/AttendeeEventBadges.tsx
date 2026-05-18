"use client";

import { Gift, Sparkles } from "lucide-react";
import { isAidevcampCohort, type AttendanceDoc } from "@/lib/attendance";
import { cn } from "@/lib/utils";

type Props = {
  attendance: AttendanceDoc | null;
  className?: string;
};

export function AttendeeEventBadges({ attendance, className }: Props) {
  const aidevcamp = isAidevcampCohort(attendance?.cohort);
  const swag = attendance?.swagReceived === true;

  if (!aidevcamp && !swag) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {aidevcamp ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          AI DevCamp 2026 attendee
        </span>
      ) : null}
      {swag ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
          <Gift className="h-3.5 w-3.5 shrink-0" />
          Swag received
        </span>
      ) : null}
    </div>
  );
}
