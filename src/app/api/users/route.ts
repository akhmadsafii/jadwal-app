import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};

    if (role) {
      where.role = role.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nip: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        position: true,
        avatarUrl: true,
        isActive: true,
        sortOrder: true,
        leaveBalance: {
          select: {
            annualLeave: true,
            sickLeave: true,
            compensation: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ],
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data user" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nip, name, email, role, position, avatarUrl, password } = await request.json();

    if (!nip || !name || !role) {
      return NextResponse.json(
        { error: "NIP, nama, dan role wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedRole = String(role).toUpperCase();
    if (!["ADMIN", "EMPLOYEE"].includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Role tidak valid" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password || "12345678", 10);

    const user = await prisma.user.create({
      data: {
        nip,
        name,
        email: email || null,
        role: normalizedRole as "ADMIN" | "EMPLOYEE",
        position: position || null,
        avatarUrl: avatarUrl || null,
        password: hashedPassword,
        sortOrder: 0,
        leaveBalance: normalizedRole === "EMPLOYEE"
          ? {
              create: {
                annualLeave: 12,
                sickLeave: 0,
                compensation: 0,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        position: true,
        avatarUrl: true,
        isActive: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "NIP atau email sudah dipakai user lain" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat user" },
      { status: 500 }
    );
  }
}
