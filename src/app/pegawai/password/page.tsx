"use client";

import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import ChangePassword from "@/components/shared/ChangePassword";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";

export default function PegawaiPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <EmployeeTopBar />

      {/* Main Content */}
      <main className="flex-1">
        <ChangePassword onBack={() => history.back()} isAdmin={false} />
      </main>

      {/* Bottom Navigation */}
      <EmployeeBottomNav />
    </div>
  );
}
