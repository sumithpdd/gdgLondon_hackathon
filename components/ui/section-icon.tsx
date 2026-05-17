import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionIconProps = {
  icon: LucideIcon;
  className?: string;
  size?: "md" | "sm";
};

/** Consistent icon container for section headings and cards. */
export function SectionIcon({ icon: Icon, className, size = "md" }: SectionIconProps) {
  return (
    <span
      className={cn(
        size === "md" ? "icon-badge text-violet-400" : "icon-badge-sm text-violet-400",
        className
      )}
    >
      <Icon className={size === "md" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}
