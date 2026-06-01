"use client";

import AdminTopBar from "@/components/admin/AdminTopBar";
import ChangePassword from "@/components/shared/ChangePassword";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

export default function AdminPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <AdminTopBar />

      {/* Main Content */}
      <main className="flex-1">
        <ChangePassword onBack={() => history.back()} isAdmin={true} />
      </main>

      {/* Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
