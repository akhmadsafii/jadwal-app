// Shift types matching database enum (short codes)
export type ShiftCode = "L" | "P" | "MID" | "S" | "M" | "C" | "X";

export interface Staff {
  id: string;
  name: string;
  nip: string;
}

export interface ShiftDistribution {
  name: string;
  code: ShiftCode;
  percentage: number;
  color: string;
}

export interface MonthlyStats {
  label: string;
  value: string;
  colorClass: string;
}

// Current month info - dynamic helper function
export function getCurrentMonthInfo(date: Date = new Date()) {
  const monthNames = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  return {
    month: date.getMonth() + 1,
    name: monthNames[date.getMonth()],
    year: date.getFullYear().toString(),
    subtitle: "Public Roster",
  };
}

// Get number of days in a month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// Generate calendar days array for a month
export function getMonthCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days: (number | null)[] = [];

  // Fill empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Fill with day numbers
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
}

// Staff Data (without schedule - schedule is per month)
export const staffData: Staff[] = [
  { id: "1", name: "Fanny Shita P., M. Sc., Apt", nip: "1984102720..." },
  { id: "2", name: "Nita Dwi Kurniawati, S.Farm.", nip: "1988122920..." },
  { id: "3", name: "Fatma Arum Sari, S.Farm.", nip: "1995061520..." },
  { id: "4", name: "Ahmad Rizki Hidayat, S.Farm.", nip: "1992031520..." },
  { id: "5", name: "Diana Putri Maharani, Apt", nip: "1994122020..." },
];

// Generate schedule for a given month (deterministic based on staff id and month)
export function generateScheduleForMonth(staffId: string, year: number, month: number): ShiftCode[] {
  const daysInMonth = getDaysInMonth(year, month);
  const schedule: ShiftCode[] = [];

  // Use staff ID to seed different patterns for each staff
  const staffNum = parseInt(staffId) || 1;
  const monthSeed = (year * 12 + month);

  // Shift patterns (cycling through different patterns)
  const patterns: ShiftCode[][] = [
    ["L", "P", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "L", "MID", "P", "P", "P", "P", "L", "P", "MID", "L", "L", "P", "P", "L", "S", "S", "L"],
    ["P", "L", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "P", "P", "P", "P", "L", "L", "L", "MID", "P", "L", "P", "P", "P", "L", "M", "M", "P"],
    ["L", "P", "P", "S", "L", "S", "MID", "MID", "L", "L", "S", "P", "MID", "P", "L", "MID", "L", "L", "S", "MID", "MID", "P", "MID", "L", "S", "P", "S", "L", "P", "P", "S"],
    ["P", "P", "L", "L", "M", "M", "P", "P", "L", "P", "MID", "MID", "L", "P", "S", "S", "P", "P", "L", "P", "P", "L", "L", "P", "P", "MID", "MID", "L", "P", "P", "L"],
    ["L", "M", "M", "P", "P", "L", "L", "P", "MID", "MID", "P", "P", "S", "S", "L", "P", "P", "L", "P", "P", "MID", "MID", "L", "P", "P", "M", "M", "P", "P", "L", "P"],
  ];

  // Select pattern based on staff number
  const basePattern = patterns[(staffNum - 1) % patterns.length];

  // Rotate pattern based on month to create variety
  const rotation = (monthSeed + staffNum) % basePattern.length;

  for (let day = 0; day < daysInMonth; day++) {
    const patternIndex = (day + rotation) % basePattern.length;
    schedule.push(basePattern[patternIndex]);
  }

  return schedule;
}

// Day names (Monday first)
export const dayNames = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];

// Current month info
export const currentMonth = {
  name: "MAY",
  year: "2026",
  subtitle: "Public Roster",
};

// Shift Distribution
export const shiftDistribution: ShiftDistribution[] = [
  { name: "Pagi (07-14)", code: "P", percentage: 40, color: "bg-primary" },
  { name: "Middle (10-17)", code: "MID", percentage: 15, color: "bg-tertiary" },
  { name: "Siang (14-21)", code: "S", percentage: 25, color: "bg-tertiary" },
  { name: "Malam (21-07)", code: "M", percentage: 20, color: "bg-secondary" },
];

// Monthly Stats (can be customized per month)
export function getMonthlyStats(year: number, month: number) {
  // Generate deterministic stats based on month
  const baseStats = [
    { label: "Total Hari Kerja", value: "22 Hari", colorClass: "text-primary" },
    { label: "Persentase Kehadiran", value: "98.5%", colorClass: "text-tertiary" },
    { label: "Total Jam Lembur", value: "14 Jam", colorClass: "text-on-surface" },
    { label: "Staff Standby", value: "4 Org", colorClass: "text-secondary" },
  ];

  // Vary stats slightly by month
  if (month % 2 === 0) {
    baseStats[1].value = "97.2%";
    baseStats[2].value = "18 Jam";
  } else {
    baseStats[1].value = "98.5%";
    baseStats[2].value = "14 Jam";
  }

  return baseStats;
}

// Shift Legend with time ranges
export const shiftLegend = [
  { code: "P", label: "Pagi (07-14)", cellClass: "cell-p" },
  { code: "MID", label: "Middle (10-17)", cellClass: "cell-mid" },
  { code: "S", label: "Siang (14-21)", cellClass: "cell-s" },
  { code: "M", label: "Malam (21-07)", cellClass: "cell-m" },
  { code: "L", label: "Libur", cellClass: "cell-l" },
  { code: "C", label: "Cuti", cellClass: "cell-c" },
  { code: "CS", label: "Cuti Sakit / Izin", cellClass: "cell-cs" },
  { code: "X", label: "Turun Jaga", cellClass: "cell-x" },
  { code: "Mg", label: "Sunday", cellClass: "bg-error-container/40" },
];

// Navigation items
export const navItems = [
  { icon: "calendar_view_month", label: "Roster", href: "/", isActive: true },
  { icon: "groups", label: "Staff", href: "/login" },
  { icon: "assignment_late", label: "Requests", href: "/pegawai" },
  { icon: "person", label: "Profile", href: "/login" },
];

// User profile
export const userProfile = {
  name: "Dr. Sarah Chen",
  imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7cYqOc4utp-Bpk4ALqKUOgAKs-3e4B4NCOXWdZjPhEumgdImz1FPrqpP1-jFw9p6Oc7FB5QEJA5nhfr1V1J4OGCNr_30BbdxoVaQZanxwW6el-ZsJLqwWIHrSvm4vwUliVMYf4L-ao3SuCky7lBHN4AbbP9cmmqoKBwoTyzmL6CubS50U6WjcNLGpGS8yNBEXXFDwwtCkKg4NHMoFn1z4saTZLJi9zXkhuzgTq_cLWK115wbupxxcXNTt-_Lus-LGyedH_0HPhw",
};

// Staff availability
export function getStaffAvailability(year: number, month: number) {
  // Generate deterministic availability based on month
  const baseOnDuty = 15;
  const variance = (month + year) % 5;

  return {
    onDuty: baseOnDuty + variance,
    offDuty: 5 - (variance % 3),
    percentage: 75 + (month % 3) * 2,
  };
}
