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

    if (!userId || !type || !startDate) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const parsedStartDate = parseLocalDate(startDate);
    const parsedEndDate = type === "TUKAR_SHIFT"
      ? parsedStartDate
      : endDate
        ? parseLocalDate(endDate)
        : parsedStartDate;

    if (type === "TUKAR_SHIFT") {
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

    const existingPendingRequest = await prisma.shiftRequest.findFirst({
      where: {
        userId,
        type,
        status: type === "TUKAR_SHIFT" ? "APPROVED" : "PENDING",
        startDate: { lte: parsedEndDate },
        OR: [
          { endDate: null, startDate: { gte: parsedStartDate } },
          { endDate: { gte: parsedStartDate } },
        ],
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: type === "TUKAR_SHIFT" ? "Tukar shift pada tanggal ini sudah pernah diproses" : "Pengajuan yang sama masih menunggu approval admin" },
        { status: 409 }
      );
    }

    const shiftRequest = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.shiftRequest.create({
        data: {
          userId,
          type,
          startDate: parsedStartDate,
          endDate: type === "TUKAR_SHIFT" ? null : endDate ? parsedEndDate : null,
          swapWithUserId: type === "TUKAR_SHIFT" ? swapWithUserId : null,
          description,
          status: type === "TUKAR_SHIFT" ? "APPROVED" : "PENDING",
        },
      });

      if (type === "TUKAR_SHIFT") {
        await swapShiftAssignments(tx, userId, swapWithUserId, parsedStartDate);
      }

      return createdRequest;
    });

    return NextResponse.json({
      success: true,
      autoApproved: type === "TUKAR_SHIFT",
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
