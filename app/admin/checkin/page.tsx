"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";
import { CheckInCodePanel } from "@/components/admin/CheckInCodePanel";
import { StaffAttendeeCheckIn } from "@/components/checkin/StaffAttendeeCheckIn";
import { useAuthContext } from "@/lib/AuthContext";

export default function AdminCheckInPage() {
  const { user } = useAuthContext();

  return (
    <ProtectedRoute requireOrganiser>
      <AdminShell
        title="Check-in desk"
        subtitle="Generate a room code for self check-in, set the time window, and check attendees in (admin or moderator)."
      >
        <div className="space-y-8">
          <CheckInCodePanel />
          <StaffAttendeeCheckIn actorUid={user?.uid ?? ""} />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
