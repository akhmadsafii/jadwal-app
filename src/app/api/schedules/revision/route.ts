import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

interface RevisionRequest {
  userId: string;
  date: string;
  requestedShift: ShiftType;
  reason: string;
}

export async function POST(request: Request) {
  try {
    const data: RevisionRequest = await request.json();

    if (!data.userId || !data.date || !data.requestedShift) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const revisionDate = new Date(data.date);
    revisionDate.setHours(0, 0, 0, 0);

    // Get current assignment to determine the original shift
    const currentAssignment = await prisma.shiftAssignment.findUnique({
      where: {
        userId_date: {
          userId: data.userId,
          date: revisionDate,
        },
      },
    });

    // Create a revision request (using ShiftRequest with TUKAR_SHIFT type)
    const revisionRequest = await prisma.shiftRequest.create({
      data: {
        userId: data.userId,
        type: "TUKAR_SHIFT",
        startDate: revisionDate,
        endDate: revisionDate,
        description: `Permintaan revisi jadwal: ${currentAssignment?.shiftType || "OFF"} → ${data.requestedShift}. Alasan: ${data.reason || "Tidak ada"}`,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan revisi berhasil dikirim",
      request: revisionRequest,
    });
  } catch (error) {
    console.error("Create revision request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim permintaan revisi" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    const requests = await prisma.shiftRequest.findMany({
      where: {
        userId,
        type: "TUKAR_SHIFT",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get revision requests error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data" },
      { status: 500 }
    );
  }
}
