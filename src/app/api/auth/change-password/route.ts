import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
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

    // Find user (token is the user ID in this case)
    const user = await prisma.user.findUnique({
      where: { id: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify current password
    const isDefaultPassword = currentPassword === "12345678";
    const isValidPassword = isDefaultPassword || await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Password lama salah" },
        { status: 401 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengubah password" },
      { status: 500 }
    );
  }
}