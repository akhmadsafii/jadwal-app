"use client";

import { useState } from "react";
import {
  ApprovalItem,
  ApprovalStatus,
  filterTabs,
  categoryLabels,
  categoryIcons,
  statusLabels,
  statusColors,
} from "@/data/approvalData";

interface ApprovalListProps {
  items: ApprovalItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function ApprovalList({ items, onApprove, onReject }: ApprovalListProps) {
  const [activeFilter, setActiveFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredItems =
    activeFilter === "ALL"
      ? items
      : items.filter((item) => item.status === activeFilter);

  const pendingCount = items.filter((i) => i.status === "PENDING").length;

  const handleAction = (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    setTimeout(() => {
      setActionLoading(null);
      if (action === "approve") {
        onApprove?.(id);
      } else {
        onReject?.(id);
      }
    }, 500);
  };

  return (
    <section className="px-container-margin flex flex-col gap-2">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as ApprovalStatus | "ALL")}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === tab.key
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab.label}
            {tab.key === "PENDING" && pendingCount > 0 && (
              <span className="ml-1 bg-error text-white px-1.5 rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval Items */}
      <div className="flex flex-col gap-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-outline">
            <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
            <p className="text-sm">Tidak ada pengajuan</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    alt={item.requesterName}
                    className="w-full h-full object-cover"
                    src={item.avatarUrl}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-on-surface">
                    {item.requesterName}
                  </p>
                  <p className="text-[10px] text-outline">ID: {item.requesterId}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status]}
                </span>
              </div>

              {/* Description */}
              <div className="bg-surface-container p-2 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    {categoryIcons[item.category]}
                  </span>
                  <span className="text-[10px] font-semibold text-primary uppercase">
                    {categoryLabels[item.category]}
                  </span>
                </div>
                <p className="text-sm text-on-surface">{item.description}</p>
                <p className="text-[10px] text-outline mt-1">{item.date}</p>
              </div>

              {/* Action Buttons */}
              {item.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={actionLoading === item.id}
                    className="flex-1 h-10 bg-green-600 text-white rounded-lg font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {actionLoading === item.id ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px] mr-1">
                          check
                        </span>
                        Setujui
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={actionLoading === item.id}
                    className="flex-1 h-10 bg-error-container text-on-error-container rounded-lg font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {actionLoading === item.id ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px] mr-1">close</span>
                        Tolak
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}