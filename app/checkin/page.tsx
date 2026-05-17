"use client";

import { ClipboardCheck, KeyRound, Users } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CheckInCodePanel } from "@/components/admin/CheckInCodePanel";
import { SelfCheckInCard } from "@/components/checkin/SelfCheckInCard";
import { StaffAttendeeCheckIn } from "@/components/checkin/StaffAttendeeCheckIn";
import { isOrganiserRole } from "@/lib/auth";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";

export default function CheckinPage() {
  const { user, userProfile } = useAuthContext();
  const isOrganiser = isOrganiserRole(userProfile?.role);
  const isAdmin = userProfile?.role === "admin";

  return (
    <ProtectedRoute>
      <div className="space-y-10 max-w-4xl">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-emerald-400 shrink-0" />
            Event check-in
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Confirm in-person attendance for {HACKATHON_DISPLAY_NAME}. Enter the 6-digit code from the room during
            the check-in window{isOrganiser ? ", or use the organiser desk below." : ", or ask an organiser at the desk."}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-cyan-400/80">Your attendance</h2>
          <SelfCheckInCard userId={user?.uid} expanded />
        </section>

        {isOrganiser ? (
          <section className="space-y-8 pt-4 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan-400" />
              Organiser desk
            </h2>
            <CheckInCodePanel />
            <div className="space-y-3">
              <h3 className="text-sm font-mono uppercase tracking-wider text-violet-400/80 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendee list
              </h3>
              <StaffAttendeeCheckIn
                actorUid={user?.uid ?? ""}
                canResetAttendance={isAdmin}
                title="Check-in & swag desk"
                description="Check in attendees, mark swag received, and tag AI DevCamp 2026 guests. Admins can reset attendance if needed."
              />
            </div>
          </section>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
