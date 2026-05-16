"use client";

import { useEffect, useState } from "react";
import { DEFAULT_JUDGING_CRITERIA, fetchHackathonSettings, type JudgingCriterion } from "@/lib/hackathon-settings";

export function HackathonJudgingCriteriaList() {
  const [criteria, setCriteria] = useState<JudgingCriterion[]>(DEFAULT_JUDGING_CRITERIA);

  useEffect(() => {
    void fetchHackathonSettings().then((s) => {
      if (s.judgingCriteria?.length) setCriteria(s.judgingCriteria);
    });
  }, []);

  return (
    <ul className="space-y-2 text-muted-foreground">
      {criteria.map((c) => (
        <li key={c.title}>
          <strong className="text-foreground">{c.title}</strong> — {c.description}
        </li>
      ))}
    </ul>
  );
}
