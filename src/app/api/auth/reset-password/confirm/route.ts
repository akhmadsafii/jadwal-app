import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { resetToken, newPassword, confirmPassword } = await request.json();

    if (!resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field diperlukan" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password baru dan konfirmasi password tidak cocok" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token reset tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mereset password" },
      { status: 500 }
    );
  }
}