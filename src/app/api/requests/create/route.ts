import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function POST(request: Request) {
  try {
    const { userId, type, startDate, endDate, description } = await request.json();

    if (!userId || !type || !startDate) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const parsedStartDate = parseLocalDate(startDate);
    const parsedEndDate = endDate ? parseLocalDate(endDate) : parsedStartDate;

    const existingPendingRequest = await prisma.shiftRequest.findFirst({
      where: {
        userId,
        type,
        status: "PENDING",
        startDate: { lte: parsedEndDate },
        OR: [
          { endDate: null, startDate: { gte: parsedStartDate } },
          { endDate: { gte: parsedStartDate } },
        ],
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: "Pengajuan yang sama masih menunggu approval admin" },
        { status: 409 }
      );
    }

    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        userId,
        type,
        startDate: parsedStartDate,
        endDate: endDate ? parsedEndDate : null,
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
