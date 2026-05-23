export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT" | "OFF";

export interface AdminStaff {
  id: string;
  name: string;
  staffId: string;
  avatarUrl: string;
  shift: ShiftType;
}

export interface ShiftCoverage {
  name: string;
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
    shift: "MORNING",
  },
  {
    id: "2",
    name: "Siti Aminah",
    staffId: "SM-88220",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPz2Vy_PAMY1-9w1Q8IODjxZ6h45dblBFCJL0qpeDJNn3Z8U-zeS-sFJJf2GEY-gskjaGNCYFcwwepGBs1rYWenobFhrr_xTuK2gnGM-2Kuz_SwXmgHjZPh89_FJRS2CMZfNuGHrDVrwZ3ap5cdxtu6PjCdGj4AxmIUyxoAtwnhjjjZF0RMuDVcUnzdKtsJGajamsaaachKXIEByfln7JMZLeqcZ8nHJCw3VcKbPmwzRCOtDdecG9k_IdMxB59_Ynkq7_EHuLtEQ",
    shift: "AFTERNOON",
  },
  {
    id: "3",
    name: "Budi Santoso",
    staffId: "SM-88221",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs2Xo8Vi9dhPV8kpSg5p0K7peVVFEbUGtCSUQ6lvsI_YavfwcmxGXWryqyUWBpVi91kJiso8lTUADnneU6xk4_zECFLGXlkljh4Vulbd_m4kWXcCOG1oU5cAmYY-MzKBkm-ggw-lzXsobwo4rbB2JdeUlO5t9HVlHJuNuCCkIqK3gru0ohAYx8cUHqZ9cuv8wf3m47f-W0fkkKERm4et-BNHHq_jKAVk2BnOPfNz4c5cFrrjy58mkeB5snPGwNoTPUg9vm-4gzLw",
    shift: "NIGHT",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    staffId: "SM-88222",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg",
    shift: "OFF",
  },
  {
    id: "5",
    name: "Eko Wijaya",
    staffId: "SM-88223",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAmUT5moqkWBWSeGzOeH3hx_C0DOIgaZKiTX2yph53ewUsko75BgEf8Lw46fBNrZeAHQfCcfB3P4ApgiJiiRX-U2g1br5Ot4Nfu0X1aHkK0PBmyCntzYpwOzT-Vf3iA7kL5o364ZkFSvDMjm0OhGZRcTedNVo52QDtrwrr3ap_BlJTpwCqiB4cBiblKMl0ug2hwr352y_b4r8AcwZNuL6-QUaas5i6LxCCskiEJYQqiAKXZf3tC2iNO9t6FgJCjKn6V4H-EzRpGA",
    shift: "MORNING",
  },
];

// Shift Coverage Summary
export const shiftCoverage: ShiftCoverage[] = [
  {
    name: "MORNING",
    time: "06:00 - 14:00",
    current: 8,
    total: 10,
    color: "bg-primary",
    accentClass: "status-accent-morning",
  },
  {
    name: "AFTERNOON",
    time: "14:00 - 22:00",
    current: 9,
    total: 10,
    color: "bg-tertiary",
    accentClass: "status-accent-afternoon",
  },
  {
    name: "NIGHT",
    time: "22:00 - 06:00",
    current: 10,
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

// Shift Color Classes
export const shiftColors: Record<ShiftType, string> = {
  MORNING: "text-primary",
  AFTERNOON: "text-tertiary",
  NIGHT: "text-secondary",
  OFF: "text-outline",
};

export const shiftAccentClasses: Record<ShiftType, string> = {
  MORNING: "status-accent-morning",
  AFTERNOON: "status-accent-afternoon",
  NIGHT: "status-accent-night",
  OFF: "opacity-75 grayscale-[0.5]",
};

export const shiftOptions: ShiftType[] = ["MORNING", "AFTERNOON", "NIGHT", "OFF"];