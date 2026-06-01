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

export async function POST(request: Request) {
  try {
    const { schedules } = await request.json() as { schedules: ScheduleItem[] };

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Data jadwal tidak valid" },
        { status: 400 }
      );
    }

    // Perform bulk upsert
    const results = await Promise.all(
      schedules.map(async (item) => {
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
      message: `Berhasil menyimpan ${results.length} jadwal`,
      count: results.length,
    });
  } catch (error) {
    console.error("Bulk save schedules error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
