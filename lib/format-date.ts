/** Normalize Firestore Timestamp, ISO string, ms, or Date for display. */
export function coerceToDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object" && "toDate" in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === "function") {
      try {
        const d = toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
      } catch {
        return null;
      }
    }
  }
  if (typeof value === "number" || typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatLocaleDate(
  value: unknown,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-GB",
  fallback = "—"
): string {
  const d = coerceToDate(value);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

export function formatLocaleDateTime(
  value: unknown,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-GB",
  fallback = "—"
): string {
  const d = coerceToDate(value);
  if (!d) return fallback;
  try {
    return d.toLocaleString(locale, options);
  } catch {
    return fallback;
  }
}

/** Known hackathon milestone — never throws if the Date constant is valid. */
export function formatKnownDate(
  date: Date | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-GB",
  fallback = "TBC"
): string {
  if (!date || Number.isNaN(date.getTime())) return fallback;
  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

export function formatKnownDateTime(
  date: Date | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-GB",
  fallback = "TBC"
): string {
  if (!date || Number.isNaN(date.getTime())) return fallback;
  try {
    return date.toLocaleString(locale, options);
  } catch {
    return fallback;
  }
}
