"use client";

import { ApprovalItem } from "@/data/approvalData";

export default function ApprovalStats({ items }: { items: ApprovalItem[] }) {
  const total = items.length;
  const pending = items.filter((i) => i.status === "PENDING").length;
  const approved = items.filter((i) => i.status === "APPROVED").length;
  const rejected = items.filter((i) => i.status === "REJECTED").length;

  return (
    <section className="px-container-margin">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <h2 className="text-xs uppercase tracking-wider text-outline mb-3">
          Ringkasan Approval
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-surface-container rounded-lg">
            <p className="text-lg font-bold text-on-surface">{total}</p>
            <p className="text-[10px] text-outline">Total</p>
          </div>
          <div className="text-center p-2 bg-secondary-container rounded-lg">
            <p className="text-lg font-bold text-on-secondary-container">{pending}</p>
            <p className="text-[10px] text-outline">Pending</p>
          </div>
          <div className="text-center p-2 bg-green-100 rounded-lg">
            <p className="text-lg font-bold text-green-800">{approved}</p>
            <p className="text-[10px] text-outline">Disetujui</p>
          </div>
          <div className="text-center p-2 bg-error-container rounded-lg">
            <p className="text-lg font-bold text-on-error-container">{rejected}</p>
            <p className="text-[10px] text-outline">Ditolak</p>
          </div>
        </div>
      </div>
    </section>
  );
}
