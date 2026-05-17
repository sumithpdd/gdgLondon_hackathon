import { createHash } from "crypto";

export function normalizeCheckInCode(raw: string): string {
  return String(raw || "").replace(/\s/g, "").trim();
}

export function hashCheckInCode(code: string): string {
  return createHash("sha256").update(normalizeCheckInCode(code)).digest("hex");
}
