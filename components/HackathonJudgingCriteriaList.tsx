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
    <ul className="space-y-4 text-muted-foreground text-base leading-relaxed">
      {criteria.map((c) => (
        <li key={c.title} className="pl-1">
          <strong className="text-foreground text-lg">{c.title}</strong>
          <span className="text-muted-foreground"> — {c.description}</span>
        </li>
      ))}
    </ul>
  );
}
