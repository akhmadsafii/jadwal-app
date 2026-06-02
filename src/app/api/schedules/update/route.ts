import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

interface UpdateScheduleRequest {
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
    const data: UpdateScheduleRequest = await request.json();

    if (!data.userId || !data.date || !data.shiftType) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const shiftDate = parseDateKey(data.date);
    shiftDate.setHours(0, 0, 0, 0);

    const assignment = await prisma.shiftAssignment.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: shiftDate,
        },
      },
      update: { shiftType: data.shiftType },
      create: {
        userId: data.userId,
        date: shiftDate,
        shiftType: data.shiftType,
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
