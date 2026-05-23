import AdminTopBar from "@/components/admin/AdminTopBar";
import CoverageSummary from "@/components/admin/CoverageSummary";
import QuickActions from "@/components/admin/QuickActions";
import StaffList from "@/components/admin/StaffList";
import SaveActions from "@/components/admin/SaveActions";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { adminStaff } from "@/data/adminData";

export default function AdminSchedulePage() {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        <CoverageSummary />
        <QuickActions />
        <StaffList staff={adminStaff} />
        <SaveActions />
      </main>

      <AdminBottomNav />
    </div>
  );
}