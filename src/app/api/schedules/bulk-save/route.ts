import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forbidden, getAuthUser, unauthorized } from "@/lib/apiAuth";
import type { Prisma } from "@/generated/prisma/client";
import {
  sendWhatsAppMessages,
  whatsAppCodeBlock,
  whatsAppText,
  whatsAppTitle,
} from "@/lib/whatsapp";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

interface ScheduleItem {
  userId: string;
  date: string;
  shiftType: ShiftType;
}

type SaveAction = "draft" | "publish";

const requestTypeToShiftType: Record<string, ShiftType> = {
  SHIFT_PAGI: "PAGI",
  SHIFT_MIDDLE: "MIDDLE",
  SHIFT_SIANG: "SIANG",
  SHIFT_MALAM: "MALAM",
  CUTI_TAHUNAN: "CUTI",
  CUTI_SAKIT: "SAKIT",
  LIBUR: "LIBUR",
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getScheduleKey(userId: string, dateKey: string) {
  return `${userId}-${dateKey}`;
}

function formatScheduleDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function getRequestTypeLabel(type: string, hasEndDate: boolean) {
  if (type === "TUKAR_SHIFT" && hasEndDate) return "Tukar Hari";
  const labels: Record<string, string> = {
    SHIFT_PAGI: "Shift Pagi",
    SHIFT_MIDDLE: "Shift Middle",
    SHIFT_SIANG: "Shift Siang",
    SHIFT_MALAM: "Shift Malam",
    CUTI_TAHUNAN: "Cuti Tahunan",
    CUTI_SAKIT: "Izin / Sakit",
    LIBUR: "Libur",
  };
  return labels[type] || type;
}

const shiftLabels: Record<ShiftType | "NONE", string> = {
  PAGI: "Pagi",
  MIDDLE: "Middle",
  SIANG: "Siang",
  MALAM: "Malam",
  LIBUR: "Libur",
  CUTI: "Cuti",
  SAKIT: "Izin / Sakit",
  TURUN: "Turun Jaga",
  NONE: "Belum ada jadwal",
};

function groupByUser<T extends { userId: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    grouped.set(item.userId, [...(grouped.get(item.userId) || []), item]);
  });
  return grouped;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function adjustAnnualLeaveForRequest(
  tx: Prisma.TransactionClient,
  userId: string,
  changes: { date: Date; nextShiftType: ShiftType }[]
) {
  const existingAssignments = await tx.shiftAssignment.findMany({
    where: {
      userId,
      date: { in: changes.map((change) => change.date) },
    },
    select: { date: true, shiftType: true },
  });
  const existingMap = new Map(
    existingAssignments.map((assignment) => [assignment.date.getTime(), assignment.shiftType])
  );
  const delta = changes.reduce((total, change) => {
    const previousIsLeave = existingMap.get(change.date.getTime()) === "CUTI";
    const nextIsLeave = change.nextShiftType === "CUTI";
    return previousIsLeave === nextIsLeave ? total : total + (nextIsLeave ? 1 : -1);
  }, 0);

  if (delta === 0) return;

  if (delta > 0) {
    const balance = await tx.leaveBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, annualLeave: 12, sickLeave: 0, compensation: 0 },
    });
    if (balance.annualLeave < delta) throw new Error("INSUFFICIENT_LEAVE_BALANCE");
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
  tx: Prisma.TransactionClient,
  userId: string,
  firstDate: Date,
  secondDate: Date
) {
  const [firstAssignment, secondAssignment] = await Promise.all([
    tx.shiftAssignment.findUnique({ where: { userId_date: { userId, date: firstDate } } }),
    tx.shiftAssignment.findUnique({ where: { userId_date: { userId, date: secondDate } } }),
  ]);
  const firstShift: ShiftType = firstAssignment?.shiftType || "LIBUR";
  const secondShift: ShiftType = secondAssignment?.shiftType || "LIBUR";

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

function getRequestDates(request: { type: string; startDate: Date; endDate: Date | null; swapWithUserId: string | null }) {
  const start = new Date(request.startDate);
  start.setHours(0, 0, 0, 0);
  const end = request.endDate ? new Date(request.endDate) : new Date(request.startDate);
  end.setHours(0, 0, 0, 0);

  if (request.type === "TUKAR_SHIFT" && !request.swapWithUserId && request.endDate) {
    return [start, end];
  }

  const dates: Date[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    if (authUser.role !== "ADMIN") return forbidden();

    const { schedules, action = "publish", month, year } = await request.json() as {
      schedules: ScheduleItem[];
      action?: SaveAction;
      month?: number;
      year?: number;
    };

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Data jadwal tidak valid" },
        { status: 400 }
      );
    }

    if (schedules.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada jadwal untuk disimpan" },
        { status: 400 }
      );
    }

    if (action !== "draft" && action !== "publish") {
      return NextResponse.json({ error: "Pilihan penyimpanan tidak valid" }, { status: 400 });
    }

    const userIds = [...new Set(schedules.map((item) => item.userId))];
    const parsedDates = schedules.map((item) => parseDateKey(item.date));
    const minDate = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
    const maxDate = new Date(Math.max(...parsedDates.map((date) => date.getTime())));
    const editableSchedules = schedules;

    const scopeStart = month && year
      ? new Date(year, month - 1, 1)
      : minDate;
    const scopeEnd = month && year
      ? new Date(year, month, 1)
      : new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 1);

    if (action === "draft") {
      const results = await prisma.$transaction(async (tx) => {
        await tx.shiftDraftAssignment.deleteMany({
          where: {
            userId: { in: userIds },
            date: { gte: scopeStart, lt: scopeEnd },
          },
        });

        const savedDrafts = [];
        for (const item of editableSchedules) {
          const shiftDate = parseDateKey(item.date);
          shiftDate.setHours(0, 0, 0, 0);
          savedDrafts.push(await tx.shiftDraftAssignment.upsert({
            where: {
              userId_date: {
                userId: item.userId,
                date: shiftDate,
              },
            },
            update: { shiftType: item.shiftType },
            create: {
              userId: item.userId,
              date: shiftDate,
              shiftType: item.shiftType,
            },
          }));
        }
        return savedDrafts;
      });

      return NextResponse.json({
        success: true,
        action: "draft",
        message: `Draft tersimpan (${results.length} jadwal). Draft hanya terlihat oleh admin.`,
        count: results.length,
        skippedRequestSchedules: 0,
      });
    }

    const pendingAdminRequests = await prisma.shiftRequest.findMany({
      where: {
        status: "PENDING",
        startDate: { gte: scopeStart, lt: scopeEnd },
        OR: [
          { type: { not: "TUKAR_SHIFT" } },
          { type: "TUKAR_SHIFT", swapWithUserId: null },
        ],
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const pendingEmployeeSwapCount = await prisma.shiftRequest.count({
      where: {
        status: "PENDING",
        type: "TUKAR_SHIFT",
        swapWithUserId: { not: null },
        startDate: { gte: scopeStart, lt: scopeEnd },
      },
    });
    const autoApprovedScheduleKeys = new Set<string>();
    pendingAdminRequests.forEach((pendingRequest) => {
      getRequestDates(pendingRequest).forEach((date) => {
        autoApprovedScheduleKeys.add(getScheduleKey(pendingRequest.userId, toDateKey(date)));
      });
    });

    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        userId: { in: userIds },
        date: {
          gte: minDate,
          lte: maxDate,
        },
      },
      select: {
        userId: true,
        date: true,
        shiftType: true,
      },
    });

    const existingMap = new Map(
      existingAssignments.map((assignment) => [
        getScheduleKey(assignment.userId, toDateKey(assignment.date)),
        assignment.shiftType,
      ])
    );
    const changedSchedules = editableSchedules.filter((item) => {
      if (autoApprovedScheduleKeys.has(getScheduleKey(item.userId, item.date))) return false;
      const previousShift = existingMap.get(getScheduleKey(item.userId, item.date));
      return previousShift !== item.shiftType;
    });

    const leaveDeltaByUser = new Map<string, number>();
    editableSchedules.forEach((item) => {
      const previousShift = existingMap.get(getScheduleKey(item.userId, item.date));
      const previousIsLeave = previousShift === "CUTI";
      const nextIsLeave = item.shiftType === "CUTI";
      if (previousIsLeave === nextIsLeave) return;

      leaveDeltaByUser.set(
        item.userId,
        (leaveDeltaByUser.get(item.userId) || 0) + (nextIsLeave ? 1 : -1)
      );
    });

    const leaveDeductions = [...leaveDeltaByUser.entries()].filter(([, delta]) => delta > 0);
    if (leaveDeductions.length > 0) {
      const balances = await prisma.leaveBalance.findMany({
        where: { userId: { in: leaveDeductions.map(([userId]) => userId) } },
      });
      const balanceMap = new Map(balances.map((balance) => [balance.userId, balance]));

      const insufficientUser = leaveDeductions.find(([userId, delta]) => {
        const balance = balanceMap.get(userId);
        return (balance?.annualLeave ?? 12) < delta;
      });

      if (insufficientUser) {
        return NextResponse.json(
          { error: "Saldo cuti pegawai tidak cukup untuk jadwal CUTI yang dipilih" },
          { status: 409 }
        );
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const savedSchedules = [];

      for (const item of editableSchedules) {
        const shiftDate = parseDateKey(item.date);
        shiftDate.setHours(0, 0, 0, 0);

        const assignment = await tx.shiftAssignment.upsert({
          where: {
            userId_date: {
              userId: item.userId,
              date: shiftDate,
            },
          },
          update: { shiftType: item.shiftType },
          create: {
            userId: item.userId,
            date: shiftDate,
            shiftType: item.shiftType,
          },
        });
        savedSchedules.push(assignment);
      }

      for (const [userId, delta] of leaveDeltaByUser.entries()) {
        if (delta === 0) continue;
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

      for (const pendingRequest of pendingAdminRequests) {
        if (pendingRequest.type === "TUKAR_SHIFT" && pendingRequest.endDate) {
          await swapOwnDayAssignments(
            tx,
            pendingRequest.userId,
            toStartOfDay(pendingRequest.startDate),
            toStartOfDay(pendingRequest.endDate)
          );
        } else {
          const requestedShiftType = requestTypeToShiftType[pendingRequest.type];
          if (requestedShiftType) {
            const startDate = toStartOfDay(pendingRequest.startDate);
            const endDate = toStartOfDay(pendingRequest.endDate || pendingRequest.startDate);
            const changes: { date: Date; nextShiftType: ShiftType }[] = [];
            for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
              changes.push({ date, nextShiftType: requestedShiftType });
            }

            await adjustAnnualLeaveForRequest(tx, pendingRequest.userId, changes);
            for (const change of changes) {
              await tx.shiftAssignment.upsert({
                where: {
                  userId_date: {
                    userId: pendingRequest.userId,
                    date: change.date,
                  },
                },
                update: { shiftType: requestedShiftType },
                create: {
                  userId: pendingRequest.userId,
                  date: change.date,
                  shiftType: requestedShiftType,
                },
              });
            }
          }
        }

        await tx.shiftRequest.update({
          where: { id: pendingRequest.id },
          data: {
            status: "APPROVED",
            adminNotes: "Disetujui otomatis saat jadwal bulan dipublish.",
          },
        });
      }

      await tx.shiftDraftAssignment.deleteMany({
        where: {
          userId: { in: userIds },
          date: { gte: scopeStart, lt: scopeEnd },
        },
      });

      return savedSchedules;
    });

    if (pendingAdminRequests.length > 0) {
      await Promise.all([
        prisma.notification.createMany({
          data: pendingAdminRequests.map((pendingRequest) => ({
            userId: pendingRequest.userId,
            requestId: pendingRequest.id,
            type: "REQUEST_APPROVED",
            title: "Pengajuan disetujui",
            message: "Pengajuan Anda disetujui otomatis saat jadwal bulan dipublish.",
          })),
        }).catch((error) => console.error("Publish approval notifications skipped:", error)),
        prisma.auditLog.createMany({
          data: pendingAdminRequests.map((pendingRequest) => ({
            userId: authUser.userId,
            action: "REQUEST_APPROVED",
            entity: "ShiftRequest",
            entityId: pendingRequest.id,
            details: JSON.stringify({
              requesterId: pendingRequest.userId,
              source: "MONTHLY_SCHEDULE_PUBLISH",
              month: month || scopeStart.getMonth() + 1,
              year: year || scopeStart.getFullYear(),
            }),
          })),
        }).catch((error) => console.error("Publish approval audit logs skipped:", error)),
      ]);
    }

    if (changedSchedules.length > 0 || pendingAdminRequests.length > 0) {
      const whatsappUserIds = [
        ...new Set([
          ...changedSchedules.map((item) => item.userId),
          ...pendingAdminRequests.map((requestItem) => requestItem.userId),
        ]),
      ];
      const users = await prisma.user.findMany({
        where: {
          id: { in: whatsappUserIds },
          phone: { not: null },
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });
      const changesByUser = groupByUser(changedSchedules);
      const approvedRequestsByUser = groupByUser(pendingAdminRequests);
      const monthLabel = formatMonthLabel(scopeStart);

      await sendWhatsAppMessages(
        users.map((user) => {
          const userChanges = (changesByUser.get(user.id) || [])
            .sort((a, b) => a.date.localeCompare(b.date));
          const userApprovedRequests = (approvedRequestsByUser.get(user.id) || [])
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
          const approvedRequestLines = userApprovedRequests.slice(0, 5).map((requestItem) => {
            const startLabel = formatScheduleDate(toDateKey(requestItem.startDate));
            const endLabel = requestItem.endDate
              ? formatScheduleDate(toDateKey(requestItem.endDate))
              : null;
            return `${getRequestTypeLabel(requestItem.type, Boolean(requestItem.endDate))}: ${endLabel ? `${startLabel} -> ${endLabel}` : startLabel}`;
          });
          const remainingApprovedRequestCount = userApprovedRequests.length - approvedRequestLines.length;
          const detailLines = userChanges.slice(0, 10).map((item) => {
            const previousShift = existingMap.get(getScheduleKey(item.userId, item.date)) || "NONE";
            return `${formatScheduleDate(item.date)}: ${shiftLabels[previousShift]} -> ${shiftLabels[item.shiftType]}`;
          });
          const remainingCount = userChanges.length - detailLines.length;

          return {
            number: user.phone,
            message: whatsAppText(
              whatsAppTitle("Update Jadwal Pegawai"),
              "",
              `Yth. ${user.name},`,
              `Jadwal bulan ${monthLabel} sudah dipublish oleh admin.`,
              "Berikut ringkasan yang perlu diperhatikan:",
              "",
              approvedRequestLines.length > 0 ? "*Pengajuan disetujui otomatis:*" : null,
              approvedRequestLines.length > 0 ? whatsAppCodeBlock(approvedRequestLines) : null,
              remainingApprovedRequestCount > 0 ? `_${remainingApprovedRequestCount} pengajuan lainnya juga disetujui otomatis._` : null,
              approvedRequestLines.length > 0 ? "" : null,
              detailLines.length > 0 ? "*Perubahan jadwal Anda:*" : null,
              detailLines.length > 0 ? whatsAppCodeBlock(detailLines) : null,
              remainingCount > 0 ? `_${remainingCount} perubahan jadwal lainnya tersedia di aplikasi._` : null,
              "",
              `Total perubahan jadwal: ${userChanges.length}`,
              `Total pengajuan disetujui otomatis: ${userApprovedRequests.length}`,
              "",
              "Silakan cek aplikasi untuk melihat jadwal lengkap terbaru."
            ),
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      action: "publish",
      message: `Berhasil mempublish ${results.length} jadwal dan menyetujui ${pendingAdminRequests.length} pengajuan${pendingEmployeeSwapCount > 0 ? `. ${pendingEmployeeSwapCount} tukar shift antarpegawai tetap menunggu persetujuan pegawai tujuan` : ""}`,
      count: results.length,
      approvedRequestCount: pendingAdminRequests.length,
      pendingEmployeeSwapCount,
      skippedRequestSchedules: 0,
      leaveAdjustments: Object.fromEntries(leaveDeltaByUser),
    });
  } catch (error) {
    console.error("Bulk save schedules error:", error);
    if (error instanceof Error && error.message === "INSUFFICIENT_LEAVE_BALANCE") {
      return NextResponse.json(
        { error: "Saldo cuti pegawai tidak cukup untuk menyetujui semua pengajuan bulan ini" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
