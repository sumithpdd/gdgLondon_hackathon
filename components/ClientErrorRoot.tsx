"use client";

import { usePathname } from "next/navigation";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { installGlobalErrorListeners, reportClientError } from "@/lib/clientErrorLogger";

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportClientError({
      source: "react",
      message: error.message || "React render error",
      name: error.name,
      stack: `${error.stack || ""}\n${info.componentStack || ""}`.slice(0, 10_000),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-6 py-12">
          <div className="max-w-md text-center rounded-3xl border border-destructive/30 bg-destructive/10 p-8 space-y-4">
            <p className="text-lg font-semibold text-foreground">Something went wrong</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The error was reported automatically. Try refreshing the page.
            </p>
            <Button type="button" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ClientErrorRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    installGlobalErrorListeners();
  }, []);

  return <RouteErrorBoundary key={pathname}>{children}</RouteErrorBoundary>;
}
