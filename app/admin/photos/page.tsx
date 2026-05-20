"use client";

import { AdminShell } from "@/components/AdminShell";
import { AdminEventPhotosPanel } from "@/components/admin/AdminEventPhotosPanel";
import { useAuthContext } from "@/lib/AuthContext";

export default function AdminPhotosPage() {
  const { user } = useAuthContext();

  return (
    <AdminShell title="Event photos" subtitle="Upload and manage the public event gallery.">
      <AdminEventPhotosPanel adminUid={user?.uid ?? ""} />
    </AdminShell>
  );
}
