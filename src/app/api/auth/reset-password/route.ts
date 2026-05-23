import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { nip } = await request.json();

    if (!nip) {
      return NextResponse.json(
        { error: "NIP diperlukan" },
        { status: 400 }
      );
    }

    // Find user by NIP
    const user = await prisma.user.findFirst({
      where: { nip, role: "EMPLOYEE" },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pegawai dengan NIP tersebut tidak ditemukan" },
        { status: 404 }
      );
    }

    // Generate reset token
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    return NextResponse.json({
      success: true,
      message: "Token reset password telah dibuat",
      resetToken,
      instruction: "Hubungi admin untuk reset password atau gunakan token di atas untuk testing",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses reset password" },
      { status: 500 }
    );
  }
}