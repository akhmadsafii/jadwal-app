import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const requests = await prisma.shiftRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            position: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data pengajuan" },
      { status: 500 }
    );
  }
}