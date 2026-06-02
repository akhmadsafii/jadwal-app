import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nip, name, email, role, position, avatarUrl, isActive, sortOrder, password } = await request.json();

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

    const data: any = {
      nip,
      name,
      email: email || null,
      role: normalizedRole,
      position: position || null,
      avatarUrl: avatarUrl || null,
      isActive: Boolean(isActive),
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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

    if (normalizedRole === "EMPLOYEE") {
      await prisma.leaveBalance.upsert({
        where: { userId: id },
        update: {},
        create: {
          userId: id,
          annualLeave: 12,
          sickLeave: 0,
          compensation: 0,
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "NIP atau email sudah dipakai user lain" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui user" },
      { status: 500 }
    );
  }
}
