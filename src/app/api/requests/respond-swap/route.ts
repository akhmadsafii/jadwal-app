import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { swapShiftAssignments } from "@/lib/swapShiftAssignments";

function getAuthenticatedUserId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token ? verifyToken(token)?.userId || null : null;
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function POST(request: Request) {
  const targetUserId = getAuthenticatedUserId(request);
  if (!targetUserId) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const { requestId, decision } = await request.json();
  if (!requestId || !["APPROVED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ error: "Keputusan tidak valid" }, { status: 400 });
  }

  try {
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const swapRequest = await tx.shiftRequest.findFirst({
        where: {
          id: requestId,
          type: "TUKAR_SHIFT",
          swapWithUserId: targetUserId,
          status: "PENDING",
        },
      });

      if (!swapRequest) throw new Error("SWAP_NOT_AVAILABLE");

      const updated = await tx.shiftRequest.update({
        where: { id: swapRequest.id },
        data: { status: decision },
      });

      if (decision === "APPROVED") {
        await swapShiftAssignments(tx, updated.userId, targetUserId, toStartOfDay(updated.startDate));
      }

      await tx.notification.updateMany({
        where: { userId: targetUserId, requestId: updated.id },
        data: { isRead: true, type: "SHIFT_SWAP_RESPONDED" },
      });

      await tx.notification.create({
        data: {
          userId: updated.userId,
          requestId: updated.id,
          type: decision === "APPROVED" ? "SHIFT_SWAP_APPROVED" : "SHIFT_SWAP_REJECTED",
          title: decision === "APPROVED" ? "Tukar shift disetujui" : "Tukar shift ditolak",
          message: decision === "APPROVED"
            ? "Karyawan tujuan menyetujui tukar shift Anda. Jadwal sudah diperbarui."
            : "Karyawan tujuan menolak pengajuan tukar shift Anda.",
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    if (error instanceof Error && error.message === "SWAP_NOT_AVAILABLE") {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan atau sudah ditanggapi" }, { status: 404 });
    }
    console.error("Respond swap request error:", error);
    return NextResponse.json({ error: "Gagal menanggapi tukar shift" }, { status: 500 });
  }
}
