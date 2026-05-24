"use client";

import { useRouter } from "next/navigation";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EditProfile from "@/components/shared/EditProfile";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";

export default function EmployeeProfilePage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/pegawai");
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Top AppBar */}
      <header className="bg-surface w-full top-0 sticky z-40 border-b border-outline-variant flex items-center h-16 px-container-margin">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors active:opacity-80"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold ml-2">Edit Profile</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <EditProfile onBack={handleBack} />
      </main>

      {/* Bottom Navigation */}
      <EmployeeBottomNav />
    </div>
  );
}