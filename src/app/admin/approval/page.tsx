"use client";

import { useState } from "react";
import ApprovalTopBar from "@/components/admin/ApprovalTopBar";
import ApprovalStats from "@/components/admin/ApprovalStats";
import ApprovalList from "@/components/admin/ApprovalList";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { approvalData, ApprovalItem } from "@/data/approvalData";

export default function ApprovalPage() {
  const [items, setItems] = useState<ApprovalItem[]>(approvalData);

  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "APPROVED" } : item
      )
    );
  };

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "REJECTED" } : item
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <ApprovalTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        <ApprovalStats />
        <ApprovalList items={items} onApprove={handleApprove} onReject={handleReject} />
      </main>

      <AdminBottomNav />
    </div>
  );
}