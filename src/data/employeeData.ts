// Request types matching database ShiftType
export type EmployeeShiftType =
  | "SHIFT_PAGI"      // Pagi: 07:00 - 14:00
  | "SHIFT_MIDDLE"    // Middle: 10:00 - 17:00
  | "SHIFT_SIANG"     // Siang: 14:00 - 21:00
  | "SHIFT_MALAM"     // Malam: 21:00 - 07:00
  | "CUTI_TAHUNAN"    // Cuti Tahunan
  | "CUTI_SAKIT"      // Izin / Sakit
  | "LIBUR"           // Ajukan Libur (bukan cuti)
  | "TUKAR_HARI"      // Tukar hari sendiri, butuh approval admin
  | "TUKAR_SHIFT";    // Tukar Shift

export type EmployeeRequestStatus = "pending" | "approved" | "expired" | "rejected";

export interface EmployeeLeaveBalance {
  type: "Cuti Tahunan";
  days: number;
  color: string;
}

export interface EmployeeRequest {
  id: string;
  type: EmployeeShiftType;
  startDate: string;
  endDate: string;
  status: EmployeeRequestStatus;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  nip: string;
  avatarUrl: string;
  position: string;
}

// Shift time ranges
export const shiftTimeRanges: Record<EmployeeShiftType, string> = {
  SHIFT_PAGI: "07:00 — 14:00",
  SHIFT_MIDDLE: "10:00 — 17:00",
  SHIFT_SIANG: "14:00 — 21:00",
  SHIFT_MALAM: "21:00 — 07:00",
  CUTI_TAHUNAN: "Libur",
  CUTI_SAKIT: "Izin / sakit",
  LIBUR: "Libur",
  TUKAR_HARI: "-",
  TUKAR_SHIFT: "-",
};

// Short shift codes
export const shiftCodes: Record<EmployeeShiftType, string> = {
  SHIFT_PAGI: "P",
  SHIFT_MIDDLE: "MID",
  SHIFT_SIANG: "S",
  SHIFT_MALAM: "M",
  CUTI_TAHUNAN: "L",
  CUTI_SAKIT: "CS",
  LIBUR: "L",
  TUKAR_HARI: "-",
  TUKAR_SHIFT: "-",
};

// Employee Data
export const employeeProfile: EmployeeProfile = {
  id: "1",
  name: "Rinawaty, S.Farm.",
  nip: "SM-88230",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg",
  position: "Apoteker",
};

// Leave Balance
export const employeeLeaveBalances: EmployeeLeaveBalance[] = [
  { type: "Cuti Tahunan", days: 12, color: "text-primary" },
];

// Recent Requests
export const employeeRequests: EmployeeRequest[] = [
  {
    id: "1",
    type: "SHIFT_PAGI",
    startDate: "20 Mei",
    endDate: "21 Mei",
    status: "pending",
    createdAt: "18 Mei 2026",
  },
  {
    id: "2",
    type: "CUTI_TAHUNAN",
    startDate: "15 Mei",
    endDate: "16 Mei",
    status: "approved",
    createdAt: "10 Mei 2026",
  },
  {
    id: "3",
    type: "TUKAR_SHIFT",
    startDate: "10 Mei",
    endDate: "",
    status: "expired",
    createdAt: "5 Mei 2026",
  },
];

// Request Type Labels
export const employeeRequestTypeLabels: Record<EmployeeShiftType, string> = {
  SHIFT_PAGI: "Shift Pagi (07-14)",
  SHIFT_MIDDLE: "Shift Middle (10-17)",
  SHIFT_SIANG: "Shift Siang (14-21)",
  SHIFT_MALAM: "Shift Malam (21-07)",
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Izin / Sakit",
  LIBUR: "Ajukan Libur",
  TUKAR_HARI: "Tukar Hari",
  TUKAR_SHIFT: "Tukar Shift Karyawan",
};

// Request Status Labels
export const employeeRequestStatusLabels: Record<EmployeeRequestStatus, string> = {
  pending: "PENDING",
  approved: "DISETUJUI",
  expired: "EXPIRED",
  rejected: "DITOLAK",
};

// Request Status Colors
export const employeeRequestStatusColors: Record<EmployeeRequestStatus, string> = {
  pending: "bg-secondary-container text-on-secondary-container",
  approved: "bg-green-100 text-green-800",
  expired: "bg-outline-variant text-on-surface-variant",
  rejected: "bg-error-container text-on-error-container",
};

// Request Icons
export const employeeRequestIcons: Record<EmployeeShiftType, string> = {
  SHIFT_PAGI: "wb_sunny",
  SHIFT_MIDDLE: "schedule",
  SHIFT_SIANG: "light_mode",
  SHIFT_MALAM: "nightlight",
  CUTI_TAHUNAN: "beach_access",
  CUTI_SAKIT: "medical_services",
  LIBUR: "weekend",
  TUKAR_HARI: "swap_calls",
  TUKAR_SHIFT: "swap_horiz",
};

// Request Type Options for form dropdown
export const employeeRequestTypeOptions = [
  { value: "SHIFT_PAGI", label: "Shift Pagi (07-14)" },
  { value: "SHIFT_MIDDLE", label: "Shift Middle (10-17)" },
  { value: "SHIFT_SIANG", label: "Shift Siang (14-21)" },
  { value: "SHIFT_MALAM", label: "Shift Malam (21-07)" },
  { value: "LIBUR", label: "Ajukan Libur (bukan cuti)" },
  { value: "CUTI_TAHUNAN", label: "Cuti Tahunan" },
  { value: "CUTI_SAKIT", label: "Izin / Sakit" },
  { value: "TUKAR_HARI", label: "Tukar Hari" },
  { value: "TUKAR_SHIFT", label: "Tukar Shift Karyawan" },
];

// Navigation items for logged-in employee (without Profile - accessed via avatar menu)
export const employeeNavItems = [
  { icon: "home", label: "Beranda", href: "/pegawai" },
  { icon: "calendar_month", label: "Roster", href: "/pegawai/roster" },
  { icon: "groups", label: "Jadwal", href: "/pegawai/staff" },
  { icon: "pending_actions", label: "Requests", href: "/pegawai/requests" },
];
