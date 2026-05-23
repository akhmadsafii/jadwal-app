"use client";

import { leaveBalances } from "@/data/mockData";

export default function LeaveBalanceCards() {
  return (
    <section>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {leaveBalances.map((balance, index) => (
          <div
            key={index}
            className="flex-none w-40 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm"
          >
            <p className="font-label text-label-sm text-on-surface-variant">
              {balance.type}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`font-headline text-headline-md ${balance.color} font-semibold`}
              >
                {balance.days.toString().padStart(2, "0")}
              </span>
              <span className="font-label text-label-xs text-secondary">
                hari
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}