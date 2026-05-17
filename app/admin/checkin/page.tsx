import { redirect } from "next/navigation";

/** Merged into `/checkin` (self check-in + organiser desk). */
export default function AdminCheckInRedirectPage() {
  redirect("/checkin");
}
