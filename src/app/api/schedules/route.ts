import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Calculate shift distribution
    const shiftCounts = { pagi: 0, siang: 0, malam: 0 };
    employees.forEach((emp) => {
      emp.shiftAssignments.forEach((shift) => {
        if (shift.shiftType === "PAGI") shiftCounts.pagi++;
        else if (shift.shiftType === "SIANG") shiftCounts.siang++;
        else if (shift.shiftType === "MALAM") shiftCounts.malam++;
      });
    });

    const totalAssignments = shiftCounts.pagi + shiftCounts.siang + shiftCounts.malam;
    const distribution = totalAssignments > 0
      ? {
          pagi: Math.round((shiftCounts.pagi / totalAssignments) * 100),
          siang: Math.round((shiftCounts.siang / totalAssignments) * 100),
          malam: Math.round((shiftCounts.malam / totalAssignments) * 100),
        }
      : { pagi: 45, siang: 30, malam: 25 };

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
          shiftType: s.shiftType,
        })),
        leaveBalance: emp.leaveBalance,
      })),
      monthlyStats: monthlyStats || {
        month: targetMonth,
        year: targetYear,
        totalWorkDays: 22,
        attendanceRate: 98.5,
        overtimeHours: 14,
      },
      shiftDistribution: [
        { name: "Pagi (P)", code: "P", percentage: distribution.pagi, color: "bg-primary" },
        { name: "Siang (S)", code: "S", percentage: distribution.siang, color: "bg-tertiary" },
        { name: "Malam (M)", code: "M", percentage: distribution.malam, color: "bg-secondary" },
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