export type EmployeeShiftType = "shift_pagi" | "shift_malam" | "cuti_tahunan" | "tukar_shift";
export type EmployeeRequestStatus = "pending" | "approved" | "expired" | "rejected";

export interface EmployeeLeaveBalance {
  type: "Cuti Tahunan" | "Cuti Sakit" | "Kompensasi";
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
  { type: "Cuti Sakit", days: 5, color: "text-tertiary" },
  { type: "Kompensasi", days: 2, color: "text-secondary" },
];

// Recent Requests
export const employeeRequests: EmployeeRequest[] = [
  {
    id: "1",
    type: "shift_pagi",
    startDate: "20 Mei",
    endDate: "21 Mei",
    status: "pending",
    createdAt: "18 Mei 2026",
  },
  {
    id: "2",
    type: "cuti_tahunan",
    startDate: "15 Mei",
    endDate: "16 Mei",
    status: "approved",
    createdAt: "10 Mei 2026",
  },
  {
    id: "3",
    type: "tukar_shift",
    startDate: "10 Mei",
    endDate: "",
    status: "expired",
    createdAt: "5 Mei 2026",
  },
];

// Request Type Labels
export const employeeRequestTypeLabels: Record<EmployeeShiftType, string> = {
  shift_pagi: "Shift Pagi",
  shift_malam: "Shift Malam",
  cuti_tahunan: "Cuti Tahunan",
  tukar_shift: "Tukar Shift",
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
  shift_pagi: "calendar_add_on",
  shift_malam: "nightlight",
  cuti_tahunan: "beach_access",
  tukar_shift: "swap_horiz",
};

// Request Type Options
export const employeeRequestTypeOptions = [
  { value: "shift_pagi", label: "Shift Pagi (Morning)" },
  { value: "shift_malam", label: "Shift Malam (Night)" },
  { value: "cuti_tahunan", label: "Cuti Tahunan (Annual Leave)" },
  { value: "tukar_shift", label: "Tukar Shift (Shift Swap)" },
];

// Navigation
export const employeeNavItems = [
  { icon: "home", label: "Home", href: "/" },
  { icon: "event_note", label: "Requests", href: "/pegawai", isActive: true },
  { icon: "calendar_view_month", label: "Roster", href: "/" },
  { icon: "person", label: "Profile", href: "/login" },
];