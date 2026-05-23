import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, shiftType, date } = await request.json();

    if (!userId || !shiftType || !date) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const shiftDate = new Date(date);

    const assignment = await prisma.shiftAssignment.upsert({
      where: {
        userId_date: {
          userId,
          date: shiftDate,
        },
      },
      update: { shiftType },
      create: {
        userId,
        date: shiftDate,
        shiftType,
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