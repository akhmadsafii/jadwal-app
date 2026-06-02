import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Data pembatalan tidak lengkap" },
        { status: 400 }
      );
    }

    const existing = await prisma.shiftRequest.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pengajuan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Pengajuan yang sudah diproses admin tidak bisa dibatalkan" },
        { status: 409 }
      );
    }

    await prisma.shiftRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan berhasil dibatalkan",
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membatalkan pengajuan" },
      { status: 500 }
    );
  }
}
