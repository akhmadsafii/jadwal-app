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
    } else {
      // Tukar shift antar-karyawan ditanggapi langsung oleh karyawan tujuan,
      // sehingga tidak masuk antrean approval admin.
      where.NOT = {
        type: "TUKAR_SHIFT",
        swapWithUserId: { not: null },
      };
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

    const swapUserIds = [
      ...new Set(
        requests
          .map((request) => request.swapWithUserId)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const swapUsers = swapUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: swapUserIds } },
          select: {
            id: true,
            name: true,
            nip: true,
            position: true,
            avatarUrl: true,
          },
        })
      : [];
    const swapUserMap = new Map(swapUsers.map((user) => [user.id, user]));

    return NextResponse.json({
      success: true,
      requests: requests.map((request) => ({
        ...request,
        swapWithUser: request.swapWithUserId ? swapUserMap.get(request.swapWithUserId) || null : null,
      })),
    });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data pengajuan" },
      { status: 500 }
    );
  }
}
