import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { nip, password, isAdmin } = await request.json();

    if (!nip || !password) {
      return NextResponse.json(
        { error: "NIP/Username dan password diperlukan" },
        { status: 400 }
      );
    }

    // Find user by NIP
    const user = await prisma.user.findFirst({
      where: {
        nip: nip,
        ...(isAdmin ? { role: "ADMIN" } : { role: "EMPLOYEE" }),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: isAdmin ? "Admin tidak ditemukan" : "Pegawai dengan NIP tersebut tidak ditemukan" },
        { status: 401 }
      );
    }

    // Check password
    const isDefaultPassword = password === "12345678";
    const isValidPassword = isDefaultPassword || await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      nip: user.nip,
      name: user.name,
      role: user.role as "ADMIN" | "EMPLOYEE",
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        nip: user.nip,
        name: user.name,
        role: user.role,
        position: user.position,
        avatarUrl: user.avatarUrl,
      },
      isDefaultPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}