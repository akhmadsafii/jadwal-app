"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";

export default function LeaveBalanceCards() {
  const { user, token } = useAuth();
  const [leaveBalances, setLeaveBalances] = useState([
    { type: "Cuti Tahunan", days: 0, color: "text-primary" },
    { type: "Cuti Sakit", days: 0, color: "text-tertiary" },
    { type: "Kompensasi", days: 0, color: "text-secondary" },
  ]);

  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`/api/users/${user.id}/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.balance) return;
        setLeaveBalances([
          { type: "Cuti Tahunan", days: data.balance.annualLeave, color: "text-primary" },
          { type: "Cuti Sakit", days: data.balance.sickLeave, color: "text-tertiary" },
          { type: "Kompensasi", days: data.balance.compensation, color: "text-secondary" },
        ]);
      })
      .catch(() => undefined);
  }, [user?.id, token]);

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
