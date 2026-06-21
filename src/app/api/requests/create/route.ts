import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forbidden, getAuthUser, unauthorized } from "@/lib/apiAuth";
import {
  getWhatsAppAdminNumbers,
  sendWhatsAppMessages,
  whatsAppCodeBlock,
  whatsAppField,
  whatsAppText,
  whatsAppTitle,
} from "@/lib/whatsapp";

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatRequestDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getRequestTypeLabel(type: string, isDaySwap: boolean) {
  if (isDaySwap) return "Tukar Hari";
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

function getShiftLabel(shiftType?: string) {
  const labels: Record<string, string> = {
    PAGI: "Shift Pagi",
    MIDDLE: "Shift Middle",
    SIANG: "Shift Siang",
    MALAM: "Shift Malam",
    LIBUR: "Libur",
    CUTI: "Cuti",
    SAKIT: "Izin / Sakit",
    TURUN: "Turun Jaga",
  };
  return shiftType ? labels[shiftType] || shiftType : "Belum diatur";
}

export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    if (authUser.role !== "EMPLOYEE") return forbidden();

    const { type, startDate, endDate, description, swapWithUserId } = await request.json();
    const userId = authUser.userId;
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
          status: "PENDING",
        },
      });

      return createdRequest;
    });

    void prisma.auditLog.create({
      data: {
        userId,
        action: "REQUEST_CREATED",
        entity: "ShiftRequest",
        entityId: shiftRequest.id,
        details: JSON.stringify({ type: requestType, startDate, endDate, swapWithUserId: swapWithUserId || null }),
      },
    }).catch((error) => console.error("Audit log skipped:", error));

    const dayAfterStart = new Date(parsedStartDate);
    dayAfterStart.setDate(dayAfterStart.getDate() + 1);
    const [requester, targetUser, admins, swapAssignments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, nip: true },
      }),
      isEmployeeSwap && swapWithUserId
        ? prisma.user.findUnique({
            where: { id: swapWithUserId },
            select: { name: true, phone: true },
          })
        : Promise.resolve(null),
      prisma.user.findMany({
        where: {
          role: "ADMIN",
          isActive: true,
        },
        select: { id: true, phone: true },
      }),
      isEmployeeSwap && swapWithUserId
        ? prisma.shiftAssignment.findMany({
            where: {
              userId: { in: [userId, swapWithUserId] },
              date: { gte: parsedStartDate, lt: dayAfterStart },
            },
            select: { userId: true, shiftType: true },
          })
        : Promise.resolve([]),
    ]);
    const typeLabel = getRequestTypeLabel(requestType, isDaySwap);
    const dateLabel = isDaySwap
      ? `${formatRequestDate(parsedStartDate)} -> ${formatRequestDate(parsedEndDate)}`
      : formatRequestDate(parsedStartDate);
    const shiftByUserId = new Map(swapAssignments.map((assignment) => [assignment.userId, assignment.shiftType]));
    const requesterShiftLabel = getShiftLabel(shiftByUserId.get(userId));
    const targetShiftLabel = getShiftLabel(swapWithUserId ? shiftByUserId.get(swapWithUserId) : undefined);

    try {
      const notifications = [{
        userId,
        requestId: shiftRequest.id,
        type: isEmployeeSwap ? "SHIFT_SWAP_SUBMITTED" : "REQUEST_SUBMITTED",
        title: isEmployeeSwap ? "Permintaan tukar shift dikirim" : "Pengajuan jadwal dikirim",
        message: isEmployeeSwap && targetUser
          ? `Permintaan tukar shift dengan ${targetUser.name || "karyawan tujuan"} pada ${dateLabel} menunggu persetujuan.`
          : `Pengajuan ${typeLabel} untuk ${dateLabel} menunggu persetujuan admin.`,
      }];
      if (isEmployeeSwap && swapWithUserId && targetUser) {
        notifications.push({
          userId: swapWithUserId,
          requestId: shiftRequest.id,
          type: "SHIFT_SWAP_REQUEST",
          title: "Permintaan tukar shift",
          message: `${requester?.name || "Pegawai"} mengajukan tukar shift pada ${dateLabel}. Shift pengaju: ${requesterShiftLabel}; shift Anda: ${targetShiftLabel}.`,
        });
      }
      await prisma.notification.createMany({ data: notifications });
    } catch (notificationError) {
      console.error("Create request notification skipped:", notificationError);
    }
    const adminNumbers = isEmployeeSwap
      ? []
      : [...admins.map((admin) => admin.phone).filter((phone): phone is string => Boolean(phone)), ...getWhatsAppAdminNumbers()];
    if (!isEmployeeSwap && admins.length > 0) {
      try {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            requestId: shiftRequest.id,
            type: "ADMIN_APPROVAL_REQUIRED",
            title: "Pengajuan baru menunggu approval",
            message: `${requester?.name || "Pegawai"} mengajukan ${typeLabel} untuk ${dateLabel}.`,
          })),
        });
      } catch (notificationError) {
        console.error("Admin notification skipped:", notificationError);
      }
    }
    console.info("WhatsApp admin notification targets:", {
      adminUsersWithPhone: admins.length,
      fallbackAdminNumbers: getWhatsAppAdminNumbers().length,
      totalTargets: adminNumbers.length,
    });
    await sendWhatsAppMessages(
      [
        ...adminNumbers.map((adminNumber) => ({
          number: adminNumber,
          message: whatsAppText(
            whatsAppTitle("Notifikasi Pengajuan Jadwal"),
            "",
            "Yth. Admin,",
            "Terdapat pengajuan jadwal baru yang perlu ditinjau.",
            "",
            whatsAppField("Pegawai", `${requester?.name || "Pegawai"} (${requester?.nip || "-"})`),
            whatsAppField("Jenis", typeLabel),
            whatsAppField("Tanggal", dateLabel),
            whatsAppField("Status", "Menunggu persetujuan admin"),
            "",
            "Silakan buka aplikasi untuk melihat detail pengajuan."
          ),
        })),
        ...(targetUser && isEmployeeSwap
          ? [{
              number: targetUser.phone,
              message: whatsAppText(
                whatsAppTitle("Notifikasi Tukar Shift"),
                "",
                `Yth. ${targetUser.name || "Pegawai"},`,
                "Terdapat permintaan tukar shift yang menunggu persetujuan Anda.",
                "",
                whatsAppCodeBlock([
                  `Pengaju : ${requester?.name || "Pegawai"}`,
                  `Tujuan  : ${targetUser.name || "Pegawai"}`,
                  `Tanggal : ${dateLabel}`,
                  `Shift pengaju : ${requesterShiftLabel}`,
                  `Shift Anda    : ${targetShiftLabel}`,
                  "Status  : Menunggu persetujuan Anda",
                ]),
                "",
                "Silakan buka aplikasi untuk menyetujui atau menolak pengajuan."
              ),
            }]
          : []),
      ]
    );

    return NextResponse.json({
      success: true,
      autoApproved: false,
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
