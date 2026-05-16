"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SubmitRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const edit = searchParams.get("edit");
    const qs = new URLSearchParams();
    qs.set("project", "1");
    if (edit) qs.set("edit", edit);
    router.replace(`/hackathon/my-projects?${qs.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 bg-[#0a0a0f] text-gray-400 text-sm px-4">
      <p>Moving you to My project — draft &amp; submission…</p>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center bg-[#0a0a0f] text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <SubmitRedirectInner />
    </Suspense>
  );
}
