"use client";

import AdminTopBar from "@/components/admin/AdminTopBar";
import EditProfile from "@/components/shared/EditProfile";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

export default function AdminProfilePage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <AdminTopBar />

      {/* Main Content */}
      <main className="flex-1">
        <EditProfile onBack={() => history.back()} />
      </main>

      {/* Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
