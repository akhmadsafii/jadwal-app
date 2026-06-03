import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { swapShiftAssignments } from "@/lib/swapShiftAssignments";
import { getWhatsAppAdminNumbers, sendWhatsAppMessages } from "@/lib/whatsapp";

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

    const [requester, targetUser, admins] = await Promise.all([
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
          phone: { not: null },
        },
        select: { phone: true },
      }),
    ]);
    const typeLabel = getRequestTypeLabel(requestType, isDaySwap);
    const dateLabel = isDaySwap
      ? `${formatRequestDate(parsedStartDate)} -> ${formatRequestDate(parsedEndDate)}`
      : formatRequestDate(parsedStartDate);
    const adminNumbers = [
      ...admins.map((admin) => admin.phone),
      ...getWhatsAppAdminNumbers(),
    ];
    console.info("WhatsApp admin notification targets:", {
      adminUsersWithPhone: admins.length,
      fallbackAdminNumbers: getWhatsAppAdminNumbers().length,
      totalTargets: adminNumbers.length,
    });
    await sendWhatsAppMessages(
      [
        ...adminNumbers.map((adminNumber) => ({
          number: adminNumber,
          message: [
            "Notifikasi Pengajuan Jadwal",
            `Pengajuan baru diterima dari ${requester?.name || "Pegawai"} (${requester?.nip || "-"})`,
            `Jenis pengajuan: ${typeLabel}`,
            `Tanggal: ${dateLabel}`,
            isEmployeeSwap ? "Status: telah diproses otomatis oleh sistem." : "Status: menunggu persetujuan admin.",
          ].join("\n"),
        })),
        ...(targetUser && isEmployeeSwap
          ? [{
              number: targetUser.phone,
              message: [
                "Notifikasi Tukar Shift",
                `${requester?.name || "Pegawai"} telah menukar shift dengan Anda.`,
                `Tanggal: ${dateLabel}`,
                "Perubahan jadwal telah diproses otomatis oleh sistem.",
                "Silakan cek aplikasi untuk melihat jadwal terbaru.",
              ].join("\n"),
            }]
          : []),
      ]
    );

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
