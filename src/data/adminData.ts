// Shift types matching database enum
export type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "TURUN";

// UI display labels with time ranges
export const shiftTypeLabelMap: Record<ShiftType, string> = {
  PAGI: "Pagi (07-14)",
  MIDDLE: "Middle (10-17)",
  SIANG: "Siang (14-21)",
  MALAM: "Malam (21-07)",
  LIBUR: "Libur",
  CUTI: "Cuti",
  TURUN: "Turun Jaga",
};

// Short labels for grid cells
export const shiftTypeShortLabel: Record<ShiftType, string> = {
  PAGI: "P",
  MIDDLE: "MID",
  SIANG: "S",
  MALAM: "M",
  LIBUR: "L",
  CUTI: "C",
  TURUN: "X",
};

// Color classes for each shift type
export const shiftColors: Record<ShiftType, string> = {
  PAGI: "text-primary",
  MIDDLE: "text-tertiary",
  SIANG: "text-tertiary",
  MALAM: "text-secondary",
  LIBUR: "text-outline",
  CUTI: "text-primary",
  TURUN: "text-error",
};

// Background color classes
export const shiftBgColors: Record<ShiftType, string> = {
  PAGI: "bg-primary/10 border-primary/20",
  MIDDLE: "bg-tertiary/10 border-tertiary/20",
  SIANG: "bg-tertiary/10 border-tertiary/20",
  MALAM: "bg-secondary/10 border-secondary/20",
  LIBUR: "bg-surface-container-highest border-outline/20",
  CUTI: "bg-primary/10 border-primary/20",
  TURUN: "bg-error/10 border-error/20",
};

// Accent classes for staff rows
export const shiftAccentClasses: Record<ShiftType, string> = {
  PAGI: "border-l-4 border-l-primary",
  MIDDLE: "border-l-4 border-l-tertiary",
  SIANG: "border-l-4 border-l-tertiary",
  MALAM: "border-l-4 border-l-secondary",
  LIBUR: "opacity-60",
  CUTI: "border-l-4 border-l-primary",
  TURUN: "border-l-4 border-l-error",
};

// All shift options for dropdowns
export const shiftOptions: ShiftType[] = ["PAGI", "MIDDLE", "SIANG", "MALAM", "LIBUR", "CUTI", "TURUN"];

export interface AdminStaff {
  id: string;
  name: string;
  staffId: string;
  avatarUrl: string;
  shift: ShiftType;
}

export interface ShiftCoverage {
  name: ShiftType;
  time: string;
  current: number;
  total: number;
  color: string;
  accentClass: string;
}

// Admin Staff Data
export const adminStaff: AdminStaff[] = [
  {
    id: "1",
    name: "Aditya Pratama",
    staffId: "SM-88219",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC44EPpZNlQ460OFoxogQ1GN-aoFY6_y2gZ8_uph43oO3sRGBT6anvd11BoIjTufjk-g8uvvLdraXd5Ux1UKEZ5ZepecgbtGVCW6CTQnfFTIrB7HKypN3NtcoJ1QHuddB_NicmHAykUhL_C4gkIVSWs0ze365cn3Qr7Jz-1n-NXafXrRxb_wXfndtwVtWeE3_yFmcCb8K3LyxoFhR_eSTxk7Npra4dLdwcdoRGdLxfA1K8NGqbH5_mSiykwArS-pkq5j6_qFaLPPA",
    shift: "PAGI",
  },
  {
    id: "2",
    name: "Siti Aminah",
    staffId: "SM-88220",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPz2Vy_PAMY1-9w1Q8IODjxZ6h45dblBFCJL0qpeDJNn3Z8U-zeS-sFJJf2GEY-gskjaGNCYFcwwepGBs1rYWenobFhrr_xTuK2gnGM-2Kuz_SwXmgHjZPh89_FJRS2CMZfNuGHrDVrwZ3ap5cdxtu6PjCdGj4AxmIUyxoAtwnhjjjZF0RMuDVcUnzdKtsJGajamsaaachKXIEByfln7JMZLeqcZ8nHJCw3VcKbPmwzRCOtDdecG9k_IdMxB59_Ynkq7_EHuLtEQ",
    shift: "SIANG",
  },
  {
    id: "3",
    name: "Budi Santoso",
    staffId: "SM-88221",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs2Xo8Vi9dhPV8kpSg5p0K7peVVFEbUGtCSUQ6lvsI_YavfwcmxGXWryqyUWBpVi91kJiso8lTUADnneU6xk4_zECFLGXlkljh4Vulbd_m4kWXcCOG1oU5cAmYY-MzKBkm-ggw-lzXsobwo4rbB2JdeUlO5t9HVlHJuNuCCkIqK3gru0ohAYx8cUHqZ9cuv8wf3m47f-W0fkkKERm4et-BNHHq_jKAVk2BnOPfNz4c5cFrrjy58mkeB5snPGwNoTPUg9vm-4gzLw",
    shift: "MALAM",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    staffId: "SM-88222",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg",
    shift: "LIBUR",
  },
  {
    id: "5",
    name: "Eko Wijaya",
    staffId: "SM-88223",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAmUT5moqkWBWSeGzOeH3hx_C0DOIgaZKiTX2yph53ewUsko75BgEf8Lw46fBNrZeAHQfCcfB3P4ApgiJiiRX-U2g1br5Ot4Nfu0X1aHkK0PBmyCntzYpwOzT-Vf3iA7kL5o364ZkFSvDMjm0OhGZRcTedNVo52QDtrwrr3ap_BlJTpwCqiB4cBiblKMl0ug2hwr352y_b4r8AcwZNuL6-QUaas5i6LxCCskiEJYQqiAKXZf3tC2iNO9t6FgJCjKn6V4H-EzRpGA",
    shift: "PAGI",
  },
];

// Shift Coverage Summary
export const shiftCoverage: ShiftCoverage[] = [
  {
    name: "PAGI",
    time: "07:00 - 14:00",
    current: 8,
    total: 10,
    color: "bg-primary",
    accentClass: "status-accent-morning",
  },
  {
    name: "MIDDLE",
    time: "10:00 - 17:00",
    current: 6,
    total: 10,
    color: "bg-tertiary",
    accentClass: "status-accent-afternoon",
  },
  {
    name: "SIANG",
    time: "14:00 - 21:00",
    current: 9,
    total: 10,
    color: "bg-tertiary",
    accentClass: "status-accent-afternoon",
  },
  {
    name: "MALAM",
    time: "21:00 - 07:00",
    current: 5,
    total: 10,
    color: "bg-secondary",
    accentClass: "status-accent-night",
  },
];

// Admin Navigation
export const adminNavItems = [
  { icon: "admin_panel_settings", label: "Admin", isActive: true },
  { icon: "event_note", label: "Requests", isActive: false },
  { icon: "calendar_view_month", label: "Roster", isActive: false },
];

// Admin User Profile
export const adminProfile = {
  name: "Admin",
  imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxsX7rz7Ujgt5P7b9hIe_yvV84u51p6N4jfkelVa8OLOXrThDwxJyMitmtv-MbeQLstWGL5bc4qyh1bsYYYOlpbR0fWdZ8jFBO8lVKDqIz9EBeBud5IAp9Y_c7srfwCFTK2z1AYu8OeaiINOTg1gNz0LxgqNF5I7JsZ1nMBwYuhYyDicuZZ7coOKZmOpm0YgGB9pLtIV7RpasiezJG303e29HOVJiuaK6ECEFEzR0cfNJ2UYKngvg2AXO8irzHobKjp_eLXhvj2Q",
};

// Quick Actions
export const quickActions = [
  { icon: "auto_fix_high", label: "Auto-fill", bg: "bg-primary", textColor: "text-on-primary" },
  { icon: "content_copy", label: "Bulk Copy", bg: "bg-surface-container-high", textColor: "text-on-surface-variant" },
  { icon: "delete_sweep", label: "Clear All", bg: "bg-surface-container-high", textColor: "text-error" },
];

// Week view types
export interface ScheduleCell {
  date: Date;
  shift: ShiftType | null;
  isVacant: boolean;
}

export interface StaffScheduleRow {
  staff: AdminStaff;
  schedule: ScheduleCell[];
  totalHours: number;
}

export interface WeekSchedule {
  startDate: Date;
  days: Date[];
  staffRows: StaffScheduleRow[];
}

// Helper function to get week days
export function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday start

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

// Helper to format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Color classes for grid cells based on shift type
export const gridCellColors: Record<ShiftType, string> = {
  PAGI: "bg-primary/10 text-primary border-primary/20",
  MIDDLE: "bg-tertiary/10 text-tertiary border-tertiary/20",
  SIANG: "bg-tertiary/10 text-tertiary border-tertiary/20",
  MALAM: "bg-secondary/10 text-secondary border-secondary/20",
  LIBUR: "bg-surface-container-highest text-outline border-outline/20",
  CUTI: "bg-primary/10 text-primary border-primary/20",
  TURUN: "bg-error/10 text-error border-error/20",
};

export const gridCellActiveColor = "outline-2 outline-primary outline-offset-[-2px]";