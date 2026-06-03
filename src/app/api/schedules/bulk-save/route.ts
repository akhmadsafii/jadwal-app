import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessages } from "@/lib/whatsapp";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

interface ScheduleItem {
  userId: string;
  date: string;
  shiftType: ShiftType;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getScheduleKey(userId: string, dateKey: string) {
  return `${userId}-${dateKey}`;
}

function formatScheduleDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const shiftLabels: Record<ShiftType | "NONE", string> = {
  PAGI: "Pagi",
  MIDDLE: "Middle",
  SIANG: "Siang",
  MALAM: "Malam",
  LIBUR: "Libur",
  CUTI: "Cuti",
  SAKIT: "Izin / Sakit",
  TURUN: "Turun Jaga",
  NONE: "Belum ada jadwal",
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRequestDates(request: { type: string; startDate: Date; endDate: Date | null; swapWithUserId: string | null }) {
  const start = new Date(request.startDate);
  start.setHours(0, 0, 0, 0);
  const end = request.endDate ? new Date(request.endDate) : new Date(request.startDate);
  end.setHours(0, 0, 0, 0);

  if (request.type === "TUKAR_SHIFT" && !request.swapWithUserId && request.endDate) {
    return [start, end];
  }

  const dates: Date[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export async function POST(request: Request) {
  try {
    const { schedules } = await request.json() as { schedules: ScheduleItem[] };

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Data jadwal tidak valid" },
        { status: 400 }
      );
    }

    if (schedules.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada jadwal untuk disimpan" },
        { status: 400 }
      );
    }

    const requestedDates = new Set<string>();
    const userIds = [...new Set(schedules.map((item) => item.userId))];
    const parsedDates = schedules.map((item) => parseDateKey(item.date));
    const minDate = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
    const maxDate = new Date(Math.max(...parsedDates.map((date) => date.getTime())));

    const approvedRequests = await prisma.shiftRequest.findMany({
      where: {
        status: "APPROVED",
        type: {
          in: ["SHIFT_PAGI", "SHIFT_MIDDLE", "SHIFT_SIANG", "SHIFT_MALAM", "CUTI_TAHUNAN", "CUTI_SAKIT", "LIBUR", "TUKAR_SHIFT"],
        },
        OR: [
          { userId: { in: userIds } },
          { swapWithUserId: { in: userIds } },
        ],
        startDate: { lte: maxDate },
        AND: [{
          OR: [
            { endDate: null },
            { endDate: { gte: minDate } },
          ],
        }],
      },
      select: {
        type: true,
        userId: true,
        swapWithUserId: true,
        startDate: true,
        endDate: true,
      },
    });

    approvedRequests.forEach((request) => {
      getRequestDates(request).forEach((date) => {
        requestedDates.add(`${request.userId}-${toDateKey(date)}`);
        if (request.swapWithUserId) {
          requestedDates.add(`${request.swapWithUserId}-${toDateKey(date)}`);
        }
      });
    });

    const editableSchedules = schedules.filter((item) => {
      return !requestedDates.has(`${item.userId}-${item.date}`);
    });

    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        userId: { in: userIds },
        date: {
          gte: minDate,
          lte: maxDate,
        },
      },
      select: {
        userId: true,
        date: true,
        shiftType: true,
      },
    });

    const existingMap = new Map(
      existingAssignments.map((assignment) => [
        getScheduleKey(assignment.userId, toDateKey(assignment.date)),
        assignment.shiftType,
      ])
    );
    const changedSchedules = editableSchedules.filter((item) => {
      const previousShift = existingMap.get(getScheduleKey(item.userId, item.date));
      return previousShift !== item.shiftType;
    });

    const leaveDeltaByUser = new Map<string, number>();
    editableSchedules.forEach((item) => {
      const previousShift = existingMap.get(getScheduleKey(item.userId, item.date));
      const previousIsLeave = previousShift === "CUTI";
      const nextIsLeave = item.shiftType === "CUTI";
      if (previousIsLeave === nextIsLeave) return;

      leaveDeltaByUser.set(
        item.userId,
        (leaveDeltaByUser.get(item.userId) || 0) + (nextIsLeave ? 1 : -1)
      );
    });

    const leaveDeductions = [...leaveDeltaByUser.entries()].filter(([, delta]) => delta > 0);
    if (leaveDeductions.length > 0) {
      const balances = await prisma.leaveBalance.findMany({
        where: { userId: { in: leaveDeductions.map(([userId]) => userId) } },
      });
      const balanceMap = new Map(balances.map((balance) => [balance.userId, balance]));

      const insufficientUser = leaveDeductions.find(([userId, delta]) => {
        const balance = balanceMap.get(userId);
        return (balance?.annualLeave ?? 12) < delta;
      });

      if (insufficientUser) {
        return NextResponse.json(
          { error: "Saldo cuti pegawai tidak cukup untuk jadwal CUTI yang dipilih" },
          { status: 409 }
        );
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const savedSchedules = [];

      for (const item of editableSchedules) {
        const shiftDate = parseDateKey(item.date);
        shiftDate.setHours(0, 0, 0, 0);

        const assignment = await tx.shiftAssignment.upsert({
          where: {
            userId_date: {
              userId: item.userId,
              date: shiftDate,
            },
          },
          update: { shiftType: item.shiftType },
          create: {
            userId: item.userId,
            date: shiftDate,
            shiftType: item.shiftType,
          },
        });
        savedSchedules.push(assignment);
      }

      for (const [userId, delta] of leaveDeltaByUser.entries()) {
        if (delta === 0) continue;
        await tx.leaveBalance.upsert({
          where: { userId },
          update: delta > 0
            ? { annualLeave: { decrement: delta } }
            : { annualLeave: { increment: Math.abs(delta) } },
          create: {
            userId,
            annualLeave: delta > 0 ? Math.max(12 - delta, 0) : 12 + Math.abs(delta),
            sickLeave: 0,
            compensation: 0,
          },
        });
      }

      return savedSchedules;
    });

    if (changedSchedules.length > 0) {
      const changedUserIds = [...new Set(changedSchedules.map((item) => item.userId))];
      const users = await prisma.user.findMany({
        where: {
          id: { in: changedUserIds },
          phone: { not: null },
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });
      const changesByUser = new Map<string, ScheduleItem[]>();
      changedSchedules.forEach((item) => {
        changesByUser.set(item.userId, [...(changesByUser.get(item.userId) || []), item]);
      });

      await sendWhatsAppMessages(
        users.map((user) => {
          const userChanges = (changesByUser.get(user.id) || [])
            .sort((a, b) => a.date.localeCompare(b.date));
          const detailLines = userChanges.slice(0, 8).map((item) => {
            const previousShift = existingMap.get(getScheduleKey(item.userId, item.date)) || "NONE";
            return `${formatScheduleDate(item.date)}: ${shiftLabels[previousShift]} menjadi ${shiftLabels[item.shiftType]}`;
          });
          const remainingCount = userChanges.length - detailLines.length;

          return {
            number: user.phone,
            message: [
              "Notifikasi Perubahan Jadwal",
              `Yth. ${user.name}, jadwal Anda telah diperbarui oleh admin.`,
              ...detailLines,
              remainingCount > 0 ? `Dan ${remainingCount} perubahan jadwal lainnya.` : "",
              "Silakan cek aplikasi untuk melihat detail jadwal terbaru.",
            ].filter(Boolean).join("\n"),
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${results.length} jadwal${schedules.length - editableSchedules.length > 0 ? `, ${schedules.length - editableSchedules.length} jadwal dari request dilewati` : ""}`,
      count: results.length,
      skippedRequestSchedules: schedules.length - editableSchedules.length,
      leaveAdjustments: Object.fromEntries(leaveDeltaByUser),
    });
  } catch (error) {
    console.error("Bulk save schedules error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
