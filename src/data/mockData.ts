export type RequestType =
  | "shift_pagi"
  | "shift_malam"
  | "cuti_tahunan"
  | "tukar_shift";

export type RequestStatus = "pending" | "approved" | "expired" | "rejected";

export interface LeaveBalance {
  type: "Cuti Tahunan" | "Cuti Sakit" | "Kompensasi";
  days: number;
  color: string;
}

export interface ShiftRequest {
  id: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  status: RequestStatus;
}

export interface UrgentNeed {
  id: string;
  date: string;
  title: string;
  icon: "priority_high" | "event_busy";
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface NavItem {
  icon: string;
  label: string;
  isActive?: boolean;
}

// Leave Balance Data
export const leaveBalances: LeaveBalance[] = [
  { type: "Cuti Tahunan", days: 12, color: "text-primary" },
  { type: "Cuti Sakit", days: 5, color: "text-tertiary" },
  { type: "Kompensasi", days: 2, color: "text-secondary" },
];

// Recent Requests Data
export const recentRequests: ShiftRequest[] = [
  {
    id: "1",
    type: "shift_pagi",
    startDate: "20 Okt",
    endDate: "21 Okt",
    status: "pending",
  },
  {
    id: "2",
    type: "cuti_tahunan",
    startDate: "15 Okt",
    endDate: "16 Okt",
    status: "approved",
  },
  {
    id: "3",
    type: "tukar_shift",
    startDate: "10 Okt",
    endDate: "",
    status: "expired",
  },
];

// Urgent Needs Data
export const urgentNeeds: UrgentNeed[] = [
  {
    id: "1",
    date: "28 OKT",
    title: "Shift Malam: Butuh 3 Orang",
    icon: "priority_high",
    bgColor: "bg-error-container",
    textColor: "text-on-error-container",
    borderColor: "border-error/20",
  },
  {
    id: "2",
    date: "30 OKT",
    title: "Libur Nasional: Butuh Relawan",
    icon: "event_busy",
    bgColor: "bg-tertiary-container",
    textColor: "text-on-tertiary-container",
    borderColor: "border-tertiary/20",
  },
];

// Request Type Labels
export const requestTypeLabels: Record<RequestType, string> = {
  shift_pagi: "Shift Pagi",
  shift_malam: "Shift Malam",
  cuti_tahunan: "Cuti Tahunan",
  tukar_shift: "Tukar Shift",
};

// Request Status Labels
export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "PENDING",
  approved: "DISETUJUI",
  expired: "EXPIRED",
  rejected: "DITOLAK",
};

// Request Status Colors
export const requestStatusColors: Record<RequestStatus, string> = {
  pending: "bg-secondary-container text-on-secondary-container",
  approved: "bg-green-100 text-green-800",
  expired: "bg-outline-variant text-on-surface-variant",
  rejected: "bg-error-container text-on-error-container",
};

// Request Icons
export const requestIcons: Record<RequestType, string> = {
  shift_pagi: "calendar_add_on",
  shift_malam: "nightlight",
  cuti_tahunan: "beach_access",
  tukar_shift: "swap_horiz",
};

// Icon Background Colors
export const requestIconBg: Record<RequestType, string> = {
  shift_pagi: "bg-primary-container",
  shift_malam: "bg-secondary-container",
  cuti_tahunan: "bg-tertiary-container",
  tukar_shift: "bg-surface-dim",
};

// Request Type Options for Form
export const requestTypeOptions = [
  { value: "shift_pagi", label: "Shift Pagi (Morning)" },
  { value: "shift_malam", label: "Shift Malam (Night)" },
  { value: "cuti_tahunan", label: "Cuti Tahunan (Annual Leave)" },
  { value: "tukar_shift", label: "Tukar Shift (Shift Swap)" },
];

// Navigation Items
export const navItems: NavItem[] = [
  { icon: "admin_panel_settings", label: "Admin" },
  { icon: "event_note", label: "Requests", isActive: true },
  { icon: "calendar_view_month", label: "Roster" },
];

// User Profile
export const userProfile = {
  name: "User Profile",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAkiG-7sTn3JpT6HLChPPvIXvuDsIeiO01fBiUaorQ3s_1H1h-F6Cq2BBwjwY8uVD6zMZLpYRG2poNKB7vdb9vQDvkii7NW623P7Ccecavc-l5EL4ILN52e4MpyUoZwXuGDBqMA6xWaSjZuGTkplmrVapztpk_syUixLnURmSFdXCidjaWKwPrrpoCUkNwDsg45b6GgoTowqW0RkOxhkD97HI6Eeaq58AwP3sZ9tUAYdwVrtkHl8Cz91y84_Qpmpe4_2cuJUtl8rA",
};
