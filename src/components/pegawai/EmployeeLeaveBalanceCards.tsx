"use client";

import { employeeLeaveBalances } from "@/data/employeeData";

export default function EmployeeLeaveBalanceCards() {
  return (
    <section>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {employeeLeaveBalances.map((balance, index) => (
          <div
            key={index}
            className="flex-none w-40 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm"
          >
            <p className="text-xs text-on-surface-variant">
              {balance.type}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-lg font-bold ${balance.color}`}
              >
                {balance.days.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-secondary">
                hari
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}