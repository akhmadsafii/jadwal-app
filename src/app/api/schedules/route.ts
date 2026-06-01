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

      return NextResponse.json({
        success: true,
        schedule: userSchedule.map((s) => ({
          date: s.date,
          dateKey: toDateKey(s.date),
          shiftType: s.shiftType,
        })),
      });
    }

    // Get all employees with their shift assignments
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
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
        leaveBalance: true,
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

    return NextResponse.json({
      success: true,
      employees: employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        nip: emp.nip,
        position: emp.position,
        avatarUrl: emp.avatarUrl,
        schedule: emp.shiftAssignments.map((s) => ({
          date: s.date,
          dateKey: toDateKey(s.date),
          shiftType: s.shiftType,
        })),
        leaveBalance: emp.leaveBalance,
      })),
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
