import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeLeaveBalanceCards from "@/components/pegawai/EmployeeLeaveBalanceCards";
import EmployeeRequestForm from "@/components/pegawai/EmployeeRequestForm";
import EmployeeRecentRequests from "@/components/pegawai/EmployeeRecentRequests";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";

export default function PegawaiPage() {
  return (
    <div className="min-h-screen pb-24">
      <EmployeeTopBar />

      <main className="px-container-margin py-4 space-y-4">
        {/* Leave Balance Cards */}
        <EmployeeLeaveBalanceCards />

        {/* Request Form */}
        <EmployeeRequestForm />

        {/* Recent Requests */}
        <EmployeeRecentRequests />
      </main>

      <EmployeeBottomNav />
    </div>
  );
}