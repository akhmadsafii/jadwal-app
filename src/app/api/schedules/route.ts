import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRequestDates(request: { type: string; startDate: Date; endDate: Date | null; swapWithUserId: string | null }) {
  const start = new Date(request.startDate);
  const end = request.endDate ? new Date(request.endDate) : start;

  if (request.type === "TUKAR_SHIFT" && !request.swapWithUserId && request.endDate) {
    return [start, end];
  }

  const dates: Date[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

const shiftTypes = ["PAGI", "MIDDLE", "SIANG", "MALAM", "LIBUR", "CUTI", "SAKIT", "TURUN"] as const;
type ShiftTypeKey = (typeof shiftTypes)[number];

function createShiftCounts() {
  return {
    PAGI: 0,
    MIDDLE: 0,
    SIANG: 0,
    MALAM: 0,
    LIBUR: 0,
    CUTI: 0,
    SAKIT: 0,
    TURUN: 0,
  };
}

const workingShiftTypes = new Set<string>(["PAGI", "MIDDLE", "SIANG", "MALAM"]);
const absenceShiftTypes = new Set<string>(["CUTI", "SAKIT"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const userId = searchParams.get("userId");

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 1);
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    // If userId is provided, return single user schedule
    if (userId) {
      const userSchedule = await prisma.shiftAssignment.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        orderBy: { date: "asc" },
      });

      // Pending requests remain visible on the roster, but are not applied to
      // persisted assignments until they are approved.
      const visibleRequests = await prisma.shiftRequest.findMany({
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          OR: [
            { userId },
            { swapWithUserId: userId },
          ],
          startDate: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      // Map request types to shift types
      const requestTypeToShiftType: Record<string, string> = {
        SHIFT_PAGI: "PAGI",
        SHIFT_MIDDLE: "MIDDLE",
        SHIFT_SIANG: "SIANG",
        SHIFT_MALAM: "MALAM",
        CUTI_TAHUNAN: "CUTI",
        CUTI_SAKIT: "SAKIT",
        LIBUR: "LIBUR",
      };

      const requestDates = new Map<string, string>();
      const requestMeta = new Map<string, { requestId: string; requestStatus: string; requestType: string }>();
      const lockedRequestDates = new Set<string>();
      visibleRequests.forEach((req) => {
        getRequestDates(req).forEach((date) => {
          const dateKey = toDateKey(date);
          if (req.status === "APPROVED" && (req.userId === userId || req.swapWithUserId === userId)) {
            lockedRequestDates.add(dateKey);
          }
          requestMeta.set(dateKey, {
            requestId: req.id,
            requestStatus: req.status,
            requestType: req.type,
          });
          const shiftType = requestTypeToShiftType[req.type];
          if (shiftType && req.userId === userId) requestDates.set(dateKey, shiftType);
        });
      });

      // Build schedule entries
      const scheduleEntries: { date: Date; dateKey: string; shiftType: string; fromRequest: boolean; requestStatus?: string; requestId?: string; requestType?: string }[] = [];

      // Add regular assignments
      userSchedule.forEach((s) => {
        const dateKey = toDateKey(s.date);
        scheduleEntries.push({
          date: s.date,
          dateKey,
          shiftType: requestDates.get(dateKey) || s.shiftType,
          fromRequest: requestMeta.has(dateKey),
          requestStatus: requestMeta.get(dateKey)?.requestStatus,
          requestId: requestMeta.get(dateKey)?.requestId,
          requestType: requestMeta.get(dateKey)?.requestType,
        });
      });

      // Add request shifts (only if not already in schedule)
      const existingDates = new Set(userSchedule.map((s) => toDateKey(s.date)));
      visibleRequests.forEach((req) => {
        getRequestDates(req).forEach((date) => {
          const dateKey = toDateKey(date);
          if (!existingDates.has(dateKey)) {
            const shiftType = requestDates.get(dateKey);
            if (shiftType) {
              scheduleEntries.push({
                date,
                dateKey,
                shiftType,
                fromRequest: true,
                requestStatus: requestMeta.get(dateKey)?.requestStatus,
                requestId: requestMeta.get(dateKey)?.requestId,
                requestType: requestMeta.get(dateKey)?.requestType,
              });
            }
          }
        });
      });

      return NextResponse.json({
        success: true,
        schedule: scheduleEntries,
      });
    }

    // Get all employees with their shift assignments
    // Filter: only active users (isActive: true)
    // Sort: by sortOrder (ascending), then by name (alphabetically)
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ],
      include: {
        shiftAssignments: {
          where: {
            date: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          orderBy: { date: "asc" },
        },
        shiftRequests: {
          where: {
            status: "APPROVED",
            startDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        },
        leaveBalance: true,
      },
    });

    const employeeIds = employees.map((employee) => employee.id);
    const visibleRequestStatuses: ("APPROVED" | "PENDING")[] = ["APPROVED", "PENDING"];

    const approvedRequests = await prisma.shiftRequest.findMany({
      where: {
        status: { in: visibleRequestStatuses },
        startDate: {
          gte: monthStart,
          lt: monthEnd,
        },
        OR: [
          { userId: { in: employeeIds } },
          { swapWithUserId: { in: employeeIds } },
        ],
      },
    });

    // Get manually maintained values that cannot be derived from assignments.
    const monthlyStats = await prisma.monthlyStats.findFirst({
      where: { month: targetMonth, year: targetYear },
    });

    // Map shift type from request type
    const requestTypeToShiftType: Record<string, string> = {
      SHIFT_PAGI: "PAGI",
      SHIFT_MIDDLE: "MIDDLE",
      SHIFT_SIANG: "SIANG",
      SHIFT_MALAM: "MALAM",
      CUTI_TAHUNAN: "CUTI",
      CUTI_SAKIT: "SAKIT",
      LIBUR: "LIBUR",
    };

    const responseEmployees = employees.map((emp) => {
      // Combine schedule assignments with request-based shifts
      const scheduleEntries: {
        date: Date;
        dateKey: string;
        shiftType: string;
        fromRequest: boolean;
        requestStatus?: string;
        requestId?: string;
        requestType?: string;
      }[] = [];
      const requestDates = new Map<string, string>();
      const requestMeta = new Map<string, { requestId: string; requestStatus: string; requestType: string }>();
      const lockedRequestDates = new Set<string>();

      approvedRequests
        .filter((req) => req.userId === emp.id || req.swapWithUserId === emp.id)
        .forEach((req) => {
          getRequestDates(req).forEach((date) => {
            const dateKey = toDateKey(date);
            if (req.status === "APPROVED") lockedRequestDates.add(dateKey);
            requestMeta.set(dateKey, {
              requestId: req.id,
              requestStatus: req.status,
              requestType: req.type,
            });
            const shiftType = requestTypeToShiftType[req.type];
            if (shiftType && req.userId === emp.id) requestDates.set(dateKey, shiftType);
          });
        });

      // Add regular assignments
      emp.shiftAssignments.forEach((s) => {
        const dateKey = toDateKey(s.date);
        scheduleEntries.push({
          date: s.date,
          dateKey,
          shiftType: requestDates.get(dateKey) || s.shiftType,
          fromRequest: requestMeta.has(dateKey),
          requestStatus: requestMeta.get(dateKey)?.requestStatus,
          requestId: requestMeta.get(dateKey)?.requestId,
          requestType: requestMeta.get(dateKey)?.requestType,
        });
      });

      // Add approved request shifts (only if not already in schedule)
      const existingDates = new Set(emp.shiftAssignments.map((s) => toDateKey(s.date)));
      approvedRequests
        .filter((req) => req.userId === emp.id)
        .forEach((req) => {
          getRequestDates(req).forEach((date) => {
            const dateKey = toDateKey(date);
            if (!existingDates.has(dateKey)) {
              const shiftType = requestDates.get(dateKey);
              if (shiftType) {
                scheduleEntries.push({
                  date,
                  dateKey,
                  shiftType,
                  fromRequest: true,
                  requestStatus: requestMeta.get(dateKey)?.requestStatus,
                  requestId: requestMeta.get(dateKey)?.requestId,
                  requestType: requestMeta.get(dateKey)?.requestType,
                });
              }
            }
          });
        });

      return {
        id: emp.id,
        name: emp.name,
        nip: emp.nip,
        sortOrder: emp.sortOrder,
        position: emp.position,
        avatarUrl: emp.avatarUrl,
        schedule: scheduleEntries,
        leaveBalance: emp.leaveBalance,
      };
    });

    const shiftCounts = createShiftCounts();
    let totalWorkDays = 0;
    let absenceDays = 0;

    responseEmployees.forEach((emp) => {
      const scheduleByDate = new Map(emp.schedule.map((assignment) => [assignment.dateKey, assignment.shiftType]));

      for (let day = 1; day <= daysInMonth; day += 1) {
        const dateKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const shiftType = scheduleByDate.get(dateKey) || "LIBUR";

        if (shiftTypes.includes(shiftType as ShiftTypeKey)) {
          shiftCounts[shiftType as ShiftTypeKey] += 1;
        }
        if (workingShiftTypes.has(shiftType)) totalWorkDays += 1;
        if (absenceShiftTypes.has(shiftType)) absenceDays += 1;
      }
    });

    const totalAssignments = responseEmployees.length * daysInMonth;
    const attendanceBase = totalWorkDays + absenceDays;
    const attendanceRate = attendanceBase > 0
      ? Number(((totalWorkDays / attendanceBase) * 100).toFixed(1))
      : 0;
    const calculatedMonthlyStats = {
      month: targetMonth,
      year: targetYear,
      totalWorkDays,
      attendanceRate,
      overtimeHours: monthlyStats?.overtimeHours || 0,
    };
    const percentage = (count: number) =>
      totalAssignments > 0 ? Math.round((count / totalAssignments) * 100) : 0;

    return NextResponse.json({
      success: true,
      employees: responseEmployees,
      monthlyStats: calculatedMonthlyStats,
      shiftCounts,
      totalAssignments,
      shiftDistribution: [
        { name: "Pagi (P)", code: "P", percentage: percentage(shiftCounts.PAGI), color: "bg-primary", count: shiftCounts.PAGI },
        { name: "Middle (MID)", code: "MID", percentage: percentage(shiftCounts.MIDDLE), color: "bg-tertiary", count: shiftCounts.MIDDLE },
        { name: "Siang (S)", code: "S", percentage: percentage(shiftCounts.SIANG), color: "bg-tertiary", count: shiftCounts.SIANG },
        { name: "Malam (M)", code: "M", percentage: percentage(shiftCounts.MALAM), color: "bg-secondary", count: shiftCounts.MALAM },
      ],
    }, {
      // Jadwal harus selalu mencerminkan perubahan terakhir; terutama Safari
      // dapat menyimpan respons GET lama saat kembali ke halaman publik.
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data jadwal" },
      { status: 500 }
    );
  }
}
