import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { swapShiftAssignments } from "@/lib/swapShiftAssignments";

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function POST(request: Request) {
  try {
    const { userId, type, startDate, endDate, description, swapWithUserId } = await request.json();
    const requestType = type === "TUKAR_HARI" ? "TUKAR_SHIFT" : type;

    if (!userId || !type || !startDate) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const parsedStartDate = parseLocalDate(startDate);
    const parsedEndDate = endDate ? parseLocalDate(endDate) : parsedStartDate;
    const rangeStart = parsedStartDate <= parsedEndDate ? parsedStartDate : parsedEndDate;
    const rangeEnd = parsedStartDate <= parsedEndDate ? parsedEndDate : parsedStartDate;
    const isEmployeeSwap = requestType === "TUKAR_SHIFT" && Boolean(swapWithUserId);
    const isDaySwap = requestType === "TUKAR_SHIFT" && !swapWithUserId;

    if (isEmployeeSwap) {
      if (!swapWithUserId) {
        return NextResponse.json(
          { error: "Pilih karyawan tujuan untuk tukar shift" },
          { status: 400 }
        );
      }

      if (swapWithUserId === userId) {
        return NextResponse.json(
          { error: "Karyawan tujuan tidak boleh sama dengan diri sendiri" },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findFirst({
        where: {
          id: swapWithUserId,
          role: "EMPLOYEE",
          isActive: true,
        },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "Karyawan tujuan tidak ditemukan atau sudah nonaktif" },
          { status: 400 }
        );
      }
    }

    if (isDaySwap && parsedStartDate.getTime() === parsedEndDate.getTime()) {
      return NextResponse.json(
        { error: "Pilih dua tanggal yang berbeda untuk tukar hari" },
        { status: 400 }
      );
    }

    const existingPendingRequest = await prisma.shiftRequest.findFirst({
      where: {
        userId,
        type: requestType,
        status: isEmployeeSwap ? "APPROVED" : "PENDING",
        startDate: { lte: rangeEnd },
        OR: [
          { endDate: null, startDate: { gte: rangeStart } },
          { endDate: { gte: rangeStart } },
        ],
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: requestType === "TUKAR_SHIFT" ? "Pengajuan tukar pada tanggal ini sudah ada" : "Pengajuan yang sama masih menunggu approval admin" },
        { status: 409 }
      );
    }

    const shiftRequest = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.shiftRequest.create({
        data: {
          userId,
          type: requestType,
          startDate: parsedStartDate,
          endDate: isEmployeeSwap ? null : endDate ? parsedEndDate : null,
          swapWithUserId: isEmployeeSwap ? swapWithUserId : null,
          description,
          status: isEmployeeSwap ? "APPROVED" : "PENDING",
        },
      });

      if (isEmployeeSwap) {
        await swapShiftAssignments(tx, userId, swapWithUserId, parsedStartDate);
      }

      return createdRequest;
    });

    return NextResponse.json({
      success: true,
      autoApproved: isEmployeeSwap,
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
