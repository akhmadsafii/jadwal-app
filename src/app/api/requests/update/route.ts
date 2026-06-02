import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { swapShiftAssignments } from "@/lib/swapShiftAssignments";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const requestTypeToShiftType: Record<string, "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "CUTI" | "LIBUR"> = {
  SHIFT_PAGI: "PAGI",
  SHIFT_MIDDLE: "MIDDLE",
  SHIFT_SIANG: "SIANG",
  SHIFT_MALAM: "MALAM",
  CUTI_TAHUNAN: "CUTI",
  CUTI_SAKIT: "CUTI",
  LIBUR: "LIBUR",
};

export async function PUT(request: Request) {
  try {
    const { requestId, status, adminNotes } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const existing = await tx.shiftRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      });

      if (!existing) {
        throw new Error("Request not found");
      }

      const updated = await tx.shiftRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminNotes,
        },
        include: {
          user: {
            select: {
              name: true,
              nip: true,
            },
          },
        },
      });

      const isNewApproval = status === "APPROVED" && existing.status !== "APPROVED";

      if (isNewApproval && updated.type === "TUKAR_SHIFT" && updated.swapWithUserId) {
        await swapShiftAssignments(
          tx,
          updated.userId,
          updated.swapWithUserId,
          toStartOfDay(updated.startDate)
        );
      }

      const shiftType = requestTypeToShiftType[updated.type];
      if (isNewApproval && updated.type !== "TUKAR_SHIFT" && shiftType) {
        const startDate = toStartOfDay(updated.startDate);
        const endDate = toStartOfDay(updated.endDate || updated.startDate);

        for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
          await tx.shiftAssignment.upsert({
            where: {
              userId_date: {
                userId: updated.userId,
                date,
              },
            },
            update: { shiftType },
            create: {
              userId: updated.userId,
              date,
              shiftType,
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui pengajuan" },
      { status: 500 }
    );
  }
}
