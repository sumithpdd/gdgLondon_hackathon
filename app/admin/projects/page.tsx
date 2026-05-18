"use client";

import { AdminShell } from "@/components/AdminShell";
import { AdminProjectsPanel } from "@/components/admin/AdminProjectsPanel";

export default function AdminProjectsPage() {
  return (
    <AdminShell
      title="All projects"
      subtitle="Every draft and final submission — expand a row for full details, screenshots, demo link, and GitHub."
    >
      <AdminProjectsPanel />
    </AdminShell>
  );
}
