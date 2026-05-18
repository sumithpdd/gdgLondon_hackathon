import {
  HACKATHON_EVENT_END_DATE,
  HACKATHON_EVENT_START_DATE,
  HACKATHON_WATCH_PARTY_REGISTRATION_BULLETS,
} from "@/lib/constants";

const startLabel = HACKATHON_EVENT_START_DATE.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
});
const endLabel = HACKATHON_EVENT_END_DATE.toLocaleString("en-GB", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

type Props = {
  className?: string;
  compact?: boolean;
};

/** Watch Party + hackathon registration expectations (swag, voting, cloud credits). */
export function EventParticipationNotice({ className = "", compact = false }: Props) {
  return (
    <aside
      className={`rounded-xl border border-violet-500/25 bg-violet-950/20 px-4 py-4 text-sm text-gray-300 leading-relaxed ${className}`}
    >
      <p className={compact ? "text-gray-300" : "text-gray-200"}>
        The hackathon officially starts on <strong className="text-white">{startLabel}</strong>, and once
        registered, you&apos;ll receive access to cloud credits and all participation details. The hackathon will
        conclude by <strong className="text-white">{endLabel}</strong> (London).
      </p>
      {!compact ? (
        <p className="mt-3 text-gray-400">
          Even if you&apos;re not planning to participate in the hackathon itself, registration is still mandatory
          for all attendees joining the <strong className="text-gray-200">Google I/O Watch Party</strong>.
          Registration is required in order to:
        </p>
      ) : null}
      <ul className={`list-disc list-inside space-y-1 text-gray-300 ${compact ? "mt-2" : "mt-2"}`}>
        {HACKATHON_WATCH_PARTY_REGISTRATION_BULLETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
