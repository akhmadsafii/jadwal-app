import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "TURUN";

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
        userId: true,
        swapWithUserId: true,
        startDate: true,
        endDate: true,
      },
    });

    approvedRequests.forEach((request) => {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      const end = request.endDate ? new Date(request.endDate) : new Date(request.startDate);
      end.setHours(0, 0, 0, 0);
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        requestedDates.add(`${request.userId}-${toDateKey(date)}`);
        if (request.swapWithUserId) {
          requestedDates.add(`${request.swapWithUserId}-${toDateKey(date)}`);
        }
      }
    });

    const editableSchedules = schedules.filter((item) => {
      return !requestedDates.has(`${item.userId}-${item.date}`);
    });

    // Perform bulk upsert
    const results = await Promise.all(
      editableSchedules.map(async (item) => {
        const shiftDate = parseDateKey(item.date);
        shiftDate.setHours(0, 0, 0, 0);

        return prisma.shiftAssignment.upsert({
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
      })
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${results.length} jadwal${schedules.length - editableSchedules.length > 0 ? `, ${schedules.length - editableSchedules.length} jadwal dari request dilewati` : ""}`,
      count: results.length,
      skippedRequestSchedules: schedules.length - editableSchedules.length,
    });
  } catch (error) {
    console.error("Bulk save schedules error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
