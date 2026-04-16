import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/PageLoader";

export default function Loading() {
  return (
    <AdminShell title="Scheduling">
      <div className="nav-progress-bar" aria-hidden />
      <PageLoader />
    </AdminShell>
  );
}
