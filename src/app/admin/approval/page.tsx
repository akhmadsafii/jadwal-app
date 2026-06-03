"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import ApprovalStats from "@/components/admin/ApprovalStats";
import ApprovalList from "@/components/admin/ApprovalList";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { ApprovalItem, RequestCategory } from "@/data/approvalData";
import { formatDateKey, getDateKeyFromApi } from "@/lib/dateKeys";

export default function ApprovalPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);

  const mapRequestToApproval = (request: any): ApprovalItem => {
    const categoryByType: Record<string, RequestCategory> = {
      SHIFT_PAGI: "TIME_OFF",
      SHIFT_MIDDLE: "TIME_OFF",
      SHIFT_SIANG: "TIME_OFF",
      SHIFT_MALAM: "TIME_OFF",
      CUTI_TAHUNAN: "LEAVE",
      CUTI_SAKIT: "TIME_OFF",
      TUKAR_SHIFT: "SHIFT_SWAP",
    };

    const date = formatDateKey(getDateKeyFromApi(request.startDate), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const description = request.type === "TUKAR_SHIFT"
      ? `Tukar shift dengan ${request.swapWithUser?.name || "karyawan tujuan"}`
      : request.description || request.type.replaceAll("_", " ");

    return {
      id: request.id,
      requesterName: request.user?.name || "Pegawai",
      requesterId: request.user?.nip || "-",
      avatarUrl: request.user?.avatarUrl || "",
      category: categoryByType[request.type] || "TIME_OFF",
      description,
      date,
      status: request.status,
    };
  };

  const fetchRequests = async () => {
    const response = await fetch("/api/requests");
    if (!response.ok) return;
    const data = await response.json();
    setItems((data.requests || []).map(mapRequestToApproval));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    const response = await fetch("/api/requests/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, status }),
    });
    if (response.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    }
  };

  const handleApprove = (id: string) => {
    updateStatus(id, "APPROVED");
  };

  const handleReject = (id: string) => {
    updateStatus(id, "REJECTED");
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        <ApprovalStats items={items} />
        <ApprovalList items={items} onApprove={handleApprove} onReject={handleReject} />
      </main>

      <AdminBottomNav />
    </div>
  );
}
