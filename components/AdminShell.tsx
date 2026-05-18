"use client";

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
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        {subtitle ? (
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-3xl">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
