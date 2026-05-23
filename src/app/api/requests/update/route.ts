import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const { requestId, status, adminNotes } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.shiftRequest.update({
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