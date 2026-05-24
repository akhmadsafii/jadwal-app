"use client";

import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";
import ChangePassword from "@/components/shared/ChangePassword";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

export default function AdminPasswordPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/admin/profile");
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
        <ChangePassword onBack={handleBack} isAdmin={true} />
      </main>

      {/* Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}