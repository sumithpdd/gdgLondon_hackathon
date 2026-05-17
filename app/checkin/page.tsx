"use client";

import { ClipboardCheck } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SelfCheckInCard } from "@/components/checkin/SelfCheckInCard";
import { StaffAttendeeCheckIn } from "@/components/checkin/StaffAttendeeCheckIn";
import { isOrganiserRole } from "@/lib/auth";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";

export default function CheckinPage() {
  const { user, userProfile } = useAuthContext();
  const isOrganiser = isOrganiserRole(userProfile?.role);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-emerald-400" />
            Event check-in
          </h1>
          <p className="text-gray-400 text-sm">
            Confirm in-person attendance for {HACKATHON_DISPLAY_NAME}. Enter the 6-digit code from the room during
            the check-in window, or ask an organiser at the desk.
          </p>
        </div>

        <SelfCheckInCard userId={user?.uid} />

        {isOrganiser ? (
          <StaffAttendeeCheckIn
            actorUid={user?.uid ?? ""}
            title="Organiser desk"
            description="Check in attendees by email or from the directory. Admins and moderators only."
          />
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
