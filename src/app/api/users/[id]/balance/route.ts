import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const balance = await prisma.leaveBalance.upsert({
      where: { userId: id },
      update: {},
      create: {
        userId: id,
        annualLeave: 12,
        sickLeave: 5,
        compensation: 2,
      },
    });

    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error("Get leave balance error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil saldo cuti" },
      { status: 500 }
    );
  }
}
