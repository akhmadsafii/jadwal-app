"use client";

import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import EmployeeRecentRequests from "@/components/pegawai/EmployeeRecentRequests";

export default function EmployeeRequestHistoryPage() {
  return (
    <div className="min-h-screen pb-24">
      <EmployeeTopBar />
      <main className="px-container-margin py-4">
        <EmployeeRecentRequests limit={Number.POSITIVE_INFINITY} historyMode />
      </main>
      <EmployeeBottomNav />
    </div>
  );
}
