"use client";

import { useState, useEffect } from "react";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";

interface StaffMember {
  id: string;
  name: string;
  nip: string;
  position: string;
  avatarUrl: string;
}

export default function PegawaiStaffPage() {
  const { user, token } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/users?role=EMPLOYEE", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out current user
          const otherStaff = data.users?.filter((u: any) => u.id !== user?.id) || [];
          setStaff(otherStaff);
        }
      } catch (error) {
        console.error("Failed to fetch staff:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [token, user?.id]);

  return (
    <div className="min-h-screen pb-24">
      <EmployeeTopBar />

      <main className="pt-14 px-container-margin">
        <div className="py-4">
          <h1 className="text-headline-md font-semibold text-on-surface mb-1">Staff</h1>
          <p className="text-sm text-on-surface-variant">Daftar rekan kerja Anda</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-[48px] animate-spin text-primary">
              progress_activity
            </span>
          </div>
        ) : staff.length > 0 ? (
          <div className="space-y-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                        person
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                    {member.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">{member.position}</p>
                  <p className="text-[10px] text-outline mt-0.5">NIP. {member.nip}</p>
                </div>
                <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">chat</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-50">
              group_off
            </span>
            <p className="mt-2 text-on-surface-variant">Tidak ada data staff</p>
          </div>
        )}
      </main>

      <EmployeeBottomNav />
    </div>
  );
}