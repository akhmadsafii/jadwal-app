import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, type, startDate, endDate, description } = await request.json();

    if (!userId || !type || !startDate) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      request: shiftRequest,
    });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat pengajuan" },
      { status: 500 }
    );
  }
}