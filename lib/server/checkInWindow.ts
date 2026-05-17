export type CheckInPublicFields = {
  selfCheckInEnabled?: boolean;
  windowOpensAt?: unknown;
  windowClosesAt?: unknown;
};

function toMillis(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof (raw as { toMillis?: () => number }).toMillis === "function") {
    return (raw as { toMillis: () => number }).toMillis();
  }
  if (raw instanceof Date) return raw.getTime();
  return null;
}

export function isEventSelfCheckInWindowOpen(
  cfg: CheckInPublicFields | undefined,
  now = Date.now()
): boolean {
  if (!cfg || cfg.selfCheckInEnabled !== true) return false;
  const opens = toMillis(cfg.windowOpensAt);
  const closes = toMillis(cfg.windowClosesAt);
  if (opens != null && now < opens) return false;
  if (closes != null && now > closes) return false;
  return true;
}

export function eventCheckInWindowIso(cfg: CheckInPublicFields | undefined): {
  opensAt: string | null;
  closesAt: string | null;
} {
  const opens = toMillis(cfg?.windowOpensAt);
  const closes = toMillis(cfg?.windowClosesAt);
  return {
    opensAt: opens != null ? new Date(opens).toISOString() : null,
    closesAt: closes != null ? new Date(closes).toISOString() : null,
  };
}
