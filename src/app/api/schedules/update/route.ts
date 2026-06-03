import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

interface UpdateScheduleRequest {
  userId: string;
  date: string;
  shiftType: ShiftType;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatScheduleDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export async function POST(request: Request) {
  try {
    const data: UpdateScheduleRequest = await request.json();

    if (!data.userId || !data.date || !data.shiftType) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const shiftDate = parseDateKey(data.date);
    shiftDate.setHours(0, 0, 0, 0);

    const existingAssignment = await prisma.shiftAssignment.findUnique({
      where: {
        userId_date: {
          userId: data.userId,
          date: shiftDate,
        },
      },
      select: { shiftType: true },
    });

    const assignment = await prisma.shiftAssignment.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: shiftDate,
        },
      },
      update: { shiftType: data.shiftType },
      create: {
        userId: data.userId,
        date: shiftDate,
        shiftType: data.shiftType,
      },
    });

    if (existingAssignment?.shiftType !== data.shiftType) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true, phone: true },
      });

      await sendWhatsAppMessage({
        number: user?.phone,
        message: [
          "Notifikasi Perubahan Jadwal",
          `Yth. ${user?.name || "Pegawai"}, jadwal Anda telah diperbarui oleh admin.`,
          `${formatScheduleDate(data.date)}: ${shiftLabels[existingAssignment?.shiftType || "NONE"]} menjadi ${shiftLabels[data.shiftType]}`,
          "Silakan cek aplikasi untuk melihat jadwal terbaru.",
        ].join("\n"),
      }).catch((error) => {
        console.error("WhatsApp notification error:", error);
      });
    }

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jadwal" },
      { status: 500 }
    );
  }
}
