import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { swapShiftAssignments } from "@/lib/swapShiftAssignments";
import {
  sendWhatsAppMessage,
  whatsAppCodeBlock,
  whatsAppText,
  whatsAppTitle,
} from "@/lib/whatsapp";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatRequestDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getRequestTypeLabel(type: string, hasEndDate: boolean, hasSwapUser: boolean) {
  if (type === "TUKAR_SHIFT" && hasEndDate && !hasSwapUser) return "Tukar Hari";
  const labels: Record<string, string> = {
    SHIFT_PAGI: "Shift Pagi",
    SHIFT_MIDDLE: "Shift Middle",
    SHIFT_SIANG: "Shift Siang",
    SHIFT_MALAM: "Shift Malam",
    CUTI_TAHUNAN: "Cuti Tahunan",
    CUTI_SAKIT: "Izin / Sakit",
    LIBUR: "Libur",
    TUKAR_SHIFT: "Tukar Shift Karyawan",
  };
  return labels[type] || type;
}

const requestTypeToShiftType: Record<string, "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "CUTI" | "SAKIT" | "LIBUR"> = {
  SHIFT_PAGI: "PAGI",
  SHIFT_MIDDLE: "MIDDLE",
  SHIFT_SIANG: "SIANG",
  SHIFT_MALAM: "MALAM",
  CUTI_TAHUNAN: "CUTI",
  CUTI_SAKIT: "SAKIT",
  LIBUR: "LIBUR",
};

async function adjustAnnualLeaveForShiftChanges(
  tx: any,
  userId: string,
  changes: { date: Date; nextShiftType: string }[]
) {
  if (changes.length === 0) return;

  const existingAssignments = await tx.shiftAssignment.findMany({
    where: {
      userId,
      date: { in: changes.map((change) => change.date) },
    },
    select: {
      date: true,
      shiftType: true,
    },
  });
  const existingMap = new Map(
    existingAssignments.map((assignment: any) => [assignment.date.getTime(), assignment.shiftType])
  );

  const delta = changes.reduce((total, change) => {
    const previousIsLeave = existingMap.get(change.date.getTime()) === "CUTI";
    const nextIsLeave = change.nextShiftType === "CUTI";
    if (previousIsLeave === nextIsLeave) return total;
    return total + (nextIsLeave ? 1 : -1);
  }, 0);

  if (delta === 0) return;

  if (delta > 0) {
    const balance = await tx.leaveBalance.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        annualLeave: 12,
        sickLeave: 0,
        compensation: 0,
      },
    });

    if (balance.annualLeave < delta) {
      throw new Error("INSUFFICIENT_LEAVE_BALANCE");
    }
  }

  await tx.leaveBalance.upsert({
    where: { userId },
    update: delta > 0
      ? { annualLeave: { decrement: delta } }
      : { annualLeave: { increment: Math.abs(delta) } },
    create: {
      userId,
      annualLeave: delta > 0 ? Math.max(12 - delta, 0) : 12 + Math.abs(delta),
      sickLeave: 0,
      compensation: 0,
    },
  });
}

async function swapOwnDayAssignments(
  tx: any,
  userId: string,
  firstDate: Date,
  secondDate: Date
) {
  const [firstAssignment, secondAssignment] = await Promise.all([
    tx.shiftAssignment.findUnique({
      where: { userId_date: { userId, date: firstDate } },
    }),
    tx.shiftAssignment.findUnique({
      where: { userId_date: { userId, date: secondDate } },
    }),
  ]);

  const firstShift = firstAssignment?.shiftType || "LIBUR";
  const secondShift = secondAssignment?.shiftType || "LIBUR";

  await Promise.all([
    tx.shiftAssignment.upsert({
      where: { userId_date: { userId, date: firstDate } },
      update: { shiftType: secondShift },
      create: { userId, date: firstDate, shiftType: secondShift },
    }),
    tx.shiftAssignment.upsert({
      where: { userId_date: { userId, date: secondDate } },
      update: { shiftType: firstShift },
      create: { userId, date: secondDate, shiftType: firstShift },
    }),
  ]);
}

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
              phone: true,
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

      if (isNewApproval && updated.type === "TUKAR_SHIFT" && !updated.swapWithUserId && updated.endDate) {
        await swapOwnDayAssignments(
          tx,
          updated.userId,
          toStartOfDay(updated.startDate),
          toStartOfDay(updated.endDate)
        );
      }

      const shiftType = requestTypeToShiftType[updated.type];
      if (isNewApproval && updated.type !== "TUKAR_SHIFT" && shiftType) {
        const startDate = toStartOfDay(updated.startDate);
        const endDate = toStartOfDay(updated.endDate || updated.startDate);
        const changes: { date: Date; nextShiftType: string }[] = [];

        for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
          changes.push({ date, nextShiftType: shiftType });
        }

        await adjustAnnualLeaveForShiftChanges(tx, updated.userId, changes);

        for (const change of changes) {
          await tx.shiftAssignment.upsert({
            where: {
              userId_date: {
                userId: updated.userId,
                date: change.date,
              },
            },
            update: { shiftType },
            create: {
              userId: updated.userId,
              date: change.date,
              shiftType,
            },
          });
        }
      }

      return updated;
    });

    if (updatedRequest.status === "APPROVED" || updatedRequest.status === "REJECTED") {
      const typeLabel = getRequestTypeLabel(
        updatedRequest.type,
        Boolean(updatedRequest.endDate),
        Boolean(updatedRequest.swapWithUserId)
      );
      const dateLabel = updatedRequest.endDate
        ? `${formatRequestDate(updatedRequest.startDate)} -> ${formatRequestDate(updatedRequest.endDate)}`
        : formatRequestDate(updatedRequest.startDate);
      const statusLabel = updatedRequest.status === "APPROVED" ? "DISETUJUI" : "DITOLAK";

      await sendWhatsAppMessage({
        number: updatedRequest.user.phone,
        message: whatsAppText(
          whatsAppTitle("Status Pengajuan Jadwal"),
          "",
          `Yth. ${updatedRequest.user.name || "Pegawai"},`,
          `Pengajuan Anda telah *${statusLabel}* oleh admin.`,
          "",
          whatsAppCodeBlock([
            `Jenis   : ${typeLabel}`,
            `Tanggal : ${dateLabel}`,
            `Status  : ${statusLabel}`,
          ]),
          updatedRequest.adminNotes ? "" : null,
          updatedRequest.adminNotes ? `*Catatan admin:*\n${updatedRequest.adminNotes}` : null,
          "",
          "Silakan cek aplikasi untuk melihat detail pengajuan."
        ),
      }).catch((error) => {
        console.error("WhatsApp notification error:", error);
      });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Update request error:", error);
    if (error instanceof Error && error.message === "INSUFFICIENT_LEAVE_BALANCE") {
      return NextResponse.json(
        { error: "Saldo cuti pegawai tidak cukup untuk menyetujui pengajuan ini" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui pengajuan" },
      { status: 500 }
    );
  }
}
