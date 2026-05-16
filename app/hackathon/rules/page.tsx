"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RulesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/hackathon/resources#rules");
  }, [router]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
      Opening resources &amp; rules…
    </div>
  );
}
