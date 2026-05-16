"use client";

import { PlatformChrome } from "@/components/PlatformChrome";

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <PlatformChrome mainClassName="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle ? (
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-3xl">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </PlatformChrome>
  );
}
