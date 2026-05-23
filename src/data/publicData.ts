export type ShiftCode = "L" | "P" | "S" | "M" | "MID";

export interface Staff {
  id: string;
  name: string;
  nip: string;
  schedule: ShiftCode[];
}

export interface ShiftDistribution {
  name: string;
  code: string;
  percentage: number;
  color: string;
}

export interface MonthlyStats {
  label: string;
  value: string;
  colorClass: string;
}

// Staff Data
export const staffData: Staff[] = [
  {
    id: "1",
    name: "Fanny Shita P., M. Sc., Apt",
    nip: "1984102720...",
    schedule: ["L", "P", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "L", "MID", "P", "P", "P", "P", "L", "P", "MID", "L", "L", "P", "P", "L", "S", "S", "L"],
  },
  {
    id: "2",
    name: "Nita Dwi Kurniawati, S.Farm.",
    nip: "1988122920...",
    schedule: ["P", "L", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "P", "P", "P", "P", "L", "L", "L", "MID", "P", "L", "P", "P", "P", "L", "M", "M", "P"],
  },
  {
    id: "3",
    name: "Fatma Arum Sari, S.Farm.",
    nip: "1995061520...",
    schedule: ["L", "P", "P", "S", "L", "S", "MID", "MID", "L", "L", "S", "P", "MID", "P", "L", "MID", "L", "L", "S", "MID", "MID", "P", "MID", "L", "S", "P", "S", "L", "P", "P", "S"],
  },
];

// Day names
export const dayNames = ["Jm", "Sb", "Mg", "Sn", "Sl", "Rb", "Km"];

// Current month info
export const currentMonth = {
  name: "MAY",
  year: "2026",
  subtitle: "Public Roster",
};

// Shift Distribution
export const shiftDistribution: ShiftDistribution[] = [
  { name: "Pagi (P)", code: "P", percentage: 45, color: "bg-primary" },
  { name: "Siang (S)", code: "S", percentage: 30, color: "bg-tertiary" },
  { name: "Malam (M)", code: "M", percentage: 25, color: "bg-secondary" },
];

// Monthly Stats
export const monthlyStats = [
  { label: "Total Hari Kerja", value: "22 Hari", colorClass: "text-primary" },
  { label: "Persentase Kehadiran", value: "98.5%", colorClass: "text-tertiary" },
  { label: "Total Jam Lembur", value: "14 Jam", colorClass: "text-on-surface" },
  { label: "Staff Standby", value: "4 Org", colorClass: "text-secondary" },
];

// Shift Legend
export const shiftLegend = [
  { code: "P", label: "Pagi", cellClass: "cell-p" },
  { code: "S", label: "Siang", cellClass: "cell-s" },
  { code: "M", label: "Malam", cellClass: "cell-m" },
  { code: "L", label: "Libur", cellClass: "cell-l" },
  { code: "MID", label: "Middle", cellClass: "cell-mid" },
  { code: "Mg", label: "Sunday", cellClass: "bg-error-container/40" },
];

// Navigation items
export const navItems = [
  { icon: "calendar_view_month", label: "Roster", isActive: true },
  { icon: "groups", label: "Staff", isActive: false },
  { icon: "assignment_late", label: "Requests", isActive: false },
  { icon: "person", label: "Profile", isActive: false },
];

// User profile
export const userProfile = {
  name: "Dr. Sarah Chen",
  imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7cYqOc4utp-Bpk4ALqKUOgAKs-3e4B4NCOXWdZjPhEumgdImz1FPrqpP1-jFw9p6Oc7FB5QEJA5nhfr1V1J4OGCNr_30BbdxoVaQZanxwW6el-ZsJLqwWIHrSvm4vwUliVMYf4L-ao3SuCky7lBHN4AbbP9cmmqoKBwoTyzmL6CubS50U6WjcNLGpGS8yNBEXXFDwwtCkKg4NHMoFn1z4saTZLJi9zXkhuzgTq_cLWK115wbupxxcXNTt-_Lus-LGyedH_0HPhw",
};

// Staff availability
export const staffAvailability = {
  onDuty: 15,
  offDuty: 5,
  percentage: 75,
};