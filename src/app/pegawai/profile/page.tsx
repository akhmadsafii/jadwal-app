"use client";

import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EditProfile from "@/components/shared/EditProfile";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";

export default function EmployeeProfilePage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <EmployeeTopBar />

      {/* Main Content */}
      <main className="flex-1">
        <EditProfile onBack={() => history.back()} />
      </main>

      {/* Bottom Navigation */}
      <EmployeeBottomNav />
    </div>
  );
}
