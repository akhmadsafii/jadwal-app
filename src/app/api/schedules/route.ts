import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const userId = searchParams.get("userId");
    const includePendingRequests = searchParams.get("includePendingRequests") === "1";

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // If userId is provided, return single user schedule
    if (userId) {
      const userSchedule = await prisma.shiftAssignment.findMany({
        where: {
          userId,
          date: {
            gte: new Date(targetYear, targetMonth - 1, 1),
            lt: new Date(targetYear, targetMonth, 1),
          },
        },
        orderBy: { date: "asc" },
      });

      // Get approved requests for this user
      const approvedRequests = await prisma.shiftRequest.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { userId },
            { swapWithUserId: userId },
          ],
          startDate: {
            gte: new Date(targetYear, targetMonth - 1, 1),
            lt: new Date(targetYear, targetMonth, 1),
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
      const lockedRequestDates = new Set<string>();
      approvedRequests.forEach((req) => {
        const start = new Date(req.startDate);
        const end = req.endDate ? new Date(req.endDate) : start;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = toDateKey(new Date(d));
          if (req.userId === userId || req.swapWithUserId === userId) {
            lockedRequestDates.add(dateKey);
          }
          const shiftType = requestTypeToShiftType[req.type];
          if (shiftType && req.userId === userId) requestDates.set(dateKey, shiftType);
        }
      });

      // Build schedule entries
      const scheduleEntries: { date: Date; dateKey: string; shiftType: string; fromRequest: boolean }[] = [];

      // Add regular assignments
      userSchedule.forEach((s) => {
        const dateKey = toDateKey(s.date);
        scheduleEntries.push({
          date: s.date,
          dateKey,
          shiftType: s.shiftType,
          fromRequest: lockedRequestDates.has(dateKey),
        });
      });

      // Add approved request shifts (only if not already in schedule)
      const existingDates = new Set(userSchedule.map((s) => toDateKey(s.date)));
      approvedRequests.forEach((req) => {
        const start = new Date(req.startDate);
        const end = req.endDate ? new Date(req.endDate) : start;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = toDateKey(new Date(d));
          if (!existingDates.has(dateKey)) {
            const shiftType = requestDates.get(dateKey);
            if (shiftType) {
              scheduleEntries.push({
                date: new Date(d),
                dateKey,
                shiftType,
                fromRequest: true,
              });
            }
          }
        }
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
              gte: new Date(targetYear, targetMonth - 1, 1),
              lt: new Date(targetYear, targetMonth, 1),
            },
          },
          orderBy: { date: "asc" },
        },
        shiftRequests: {
          where: {
            status: "APPROVED",
            startDate: {
              gte: new Date(targetYear, targetMonth - 1, 1),
              lt: new Date(targetYear, targetMonth, 1),
            },
          },
        },
        leaveBalance: true,
      },
    });

    const employeeIds = employees.map((employee) => employee.id);
    const visibleRequestStatuses: ("APPROVED" | "PENDING")[] = includePendingRequests
      ? ["APPROVED", "PENDING"]
      : ["APPROVED"];

    const approvedRequests = await prisma.shiftRequest.findMany({
      where: {
        status: { in: visibleRequestStatuses },
        startDate: {
          gte: new Date(targetYear, targetMonth - 1, 1),
          lt: new Date(targetYear, targetMonth, 1),
        },
        OR: [
          { userId: { in: employeeIds } },
          { swapWithUserId: { in: employeeIds } },
        ],
      },
    });

    // Get monthly stats
    const monthlyStats = await prisma.monthlyStats.findFirst({
      where: { month: targetMonth, year: targetYear },
    });

    // Calculate shift distribution from saved assignments.
    const shiftCounts = {
      PAGI: 0,
      MIDDLE: 0,
      SIANG: 0,
      MALAM: 0,
      LIBUR: 0,
      CUTI: 0,
      SAKIT: 0,
      TURUN: 0,
    };
    employees.forEach((emp) => {
      emp.shiftAssignments.forEach((shift) => {
        shiftCounts[shift.shiftType] += 1;
      });
    });

    const totalAssignments = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
    const percentage = (count: number) =>
      totalAssignments > 0 ? Math.round((count / totalAssignments) * 100) : 0;

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

    return NextResponse.json({
      success: true,
      employees: employees.map((emp) => {
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
          const start = new Date(req.startDate);
          const end = req.endDate ? new Date(req.endDate) : start;
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = toDateKey(new Date(d));
            if (req.status === "APPROVED") lockedRequestDates.add(dateKey);
            requestMeta.set(dateKey, {
              requestId: req.id,
              requestStatus: req.status,
              requestType: req.type,
            });
            const shiftType = requestTypeToShiftType[req.type];
            if (shiftType && req.userId === emp.id) requestDates.set(dateKey, shiftType);
          }
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
          const start = new Date(req.startDate);
          const end = req.endDate ? new Date(req.endDate) : start;
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = toDateKey(new Date(d));
            if (!existingDates.has(dateKey)) {
              const shiftType = requestDates.get(dateKey);
              if (shiftType) {
                scheduleEntries.push({
                  date: new Date(d),
                  dateKey,
                  shiftType,
                  fromRequest: true,
                  requestStatus: requestMeta.get(dateKey)?.requestStatus,
                  requestId: requestMeta.get(dateKey)?.requestId,
                  requestType: requestMeta.get(dateKey)?.requestType,
                });
              }
            }
          }
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
      }),
      monthlyStats: monthlyStats || {
        month: targetMonth,
        year: targetYear,
        totalWorkDays: 22,
        attendanceRate: 0,
        overtimeHours: 0,
      },
      shiftCounts,
      totalAssignments,
      shiftDistribution: [
        { name: "Pagi (P)", code: "P", percentage: percentage(shiftCounts.PAGI), color: "bg-primary", count: shiftCounts.PAGI },
        { name: "Middle (MID)", code: "MID", percentage: percentage(shiftCounts.MIDDLE), color: "bg-tertiary", count: shiftCounts.MIDDLE },
        { name: "Siang (S)", code: "S", percentage: percentage(shiftCounts.SIANG), color: "bg-tertiary", count: shiftCounts.SIANG },
        { name: "Malam (M)", code: "M", percentage: percentage(shiftCounts.MALAM), color: "bg-secondary", count: shiftCounts.MALAM },
      ],
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data jadwal" },
      { status: 500 }
    );
  }
}
