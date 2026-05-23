export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RequestCategory = "SHIFT_SWAP" | "LEAVE" | "TIME_OFF" | "OVERTIME";

export interface ApprovalItem {
  id: string;
  requesterName: string;
  requesterId: string;
  avatarUrl: string;
  category: RequestCategory;
  description: string;
  date: string;
  status: ApprovalStatus;
  shiftBefore?: string;
  shiftAfter?: string;
}

export const approvalData: ApprovalItem[] = [
  {
    id: "1",
    requesterName: "Rinawaty, S.Farm.",
    requesterId: "SM-88230",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg",
    category: "SHIFT_SWAP",
    description: "Tukar shift dengan Budi Santoso",
    date: "28 Mei 2026",
    status: "PENDING",
    shiftBefore: "MORNING",
    shiftAfter: "NIGHT",
  },
  {
    id: "2",
    requesterName: "Ahmad Fauzi",
    requesterId: "SM-88231",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC44EPpZNlQ460OFoxogQ1GN-aoFY6_y2gZ8_uph43oO3sRGBT6anvd11BoIjTufjk-g8uvvLdraXd5Ux1UKEZ5ZepecgbtGVCW6CTQnfFTIrB7HKypN3NtcoJ1QHuddB_NicmHAykUhL_C4gkIVSWs0ze365cn3Qr7Jz-1n-NXafXrRxb_wXfndtwVtWeE3_yFmcCb8K3LyxoFhR_eSTxk7Npra4dLdwcdoRGdLxfA1K8NGqbH5_mSiykwArS-pkq5j6_qFaLPPA",
    category: "LEAVE",
    description: "Cuti tahunan 3 hari",
    date: "25-27 Mei 2026",
    status: "PENDING",
  },
  {
    id: "3",
    requesterName: "Siti Nurhaliza",
    requesterId: "SM-88232",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPz2Vy_PAMY1-9w1Q8IODjxZ6h45dblBFCJL0qpeDJNn3Z8U-zeS-sFJJf2GEY-gskjaGNCYFcwwepGBs1rYWenobFhrr_xTuK2gnGM-2Kuz_SwXmgHjZPh89_FJRS2CMZfNuGHrDVrwZ3ap5cdxtu6PjCdGj4AxmIUyxoAtwnhjjjZF0RMuDVcUnzdKtsJGajamsaaachKXIEByfln7JMZLeqcZ8nHJCw3VcKbPmwzRCOtDdecG9k_IdMxB59_Ynkq7_EHuLtEQ",
    category: "TIME_OFF",
    description: "Izin sakit 1 hari",
    date: "24 Mei 2026",
    status: "APPROVED",
  },
  {
    id: "4",
    requesterName: "Budi Santoso",
    requesterId: "SM-88221",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs2Xo8Vi9dhPV8kpSg5p0K7peVVFEbUGtCSUQ6lvsI_YavfwcmxGXWryqyUWBpVi91kJiso8lTUADnneU6xk4_zECFLGXlkljh4Vulbd_m4kWXcCOG1oU5cAmYY-MzKBkm-ggw-lzXsobwo4rbB2JdeUlO5t9HVlHJuNuCCkIqK3gru0ohAYx8cUHqZ9cuv8wf3m47f-W0fkkKERm4et-BNHHq_jKAVk2BnOPfNz4c5cFrrjy58mkeB5snPGwNoTPUg9vm-4gzLw",
    category: "OVERTIME",
    description: "Lembur 4 jam",
    date: "22 Mei 2026",
    status: "REJECTED",
  },
];

export const categoryLabels: Record<RequestCategory, string> = {
  SHIFT_SWAP: "Tukar Shift",
  LEAVE: "Cuti",
  TIME_OFF: "Izin",
  OVERTIME: "Lembur",
};

export const categoryIcons: Record<RequestCategory, string> = {
  SHIFT_SWAP: "swap_horiz",
  LEAVE: "beach_access",
  TIME_OFF: "event_busy",
  OVERTIME: "schedule",
};

export const statusLabels: Record<ApprovalStatus, string> = {
  PENDING: "PENDING",
  APPROVED: "DISETUJUI",
  REJECTED: "DITOLAK",
};

export const statusColors: Record<ApprovalStatus, string> = {
  PENDING: "bg-secondary-container text-on-secondary-container",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-error-container text-on-error-container",
};

export const filterTabs = [
  { key: "ALL", label: "Semua" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Disetujui" },
  { key: "REJECTED", label: "Ditolak" },
];