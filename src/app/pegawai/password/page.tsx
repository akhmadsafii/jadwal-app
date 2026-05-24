"use client";

import { useRouter } from "next/navigation";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import ChangePassword from "@/components/shared/ChangePassword";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";

export default function PegawaiPasswordPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/pegawai/profile");
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Top AppBar */}
      <header className="bg-surface w-full top-0 sticky z-40 border-b border-outline-variant flex items-center h-16 px-container-margin">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors active:opacity-80"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold ml-2">Ganti Password</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14">
        <ChangePassword onBack={handleBack} isAdmin={false} />
      </main>

      {/* Bottom Navigation */}
      <EmployeeBottomNav />
    </div>
  );
}