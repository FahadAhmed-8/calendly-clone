import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/PageLoader";

export default function Loading() {
  return (
    <AdminShell title="Event Types">
      <div className="nav-progress-bar" aria-hidden />
      <PageLoader />
    </AdminShell>
  );
}
