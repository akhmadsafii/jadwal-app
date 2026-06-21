import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getAuthenticatedUserId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token ? verifyToken(token)?.userId || null : null;
}

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
  });
}

export async function PATCH(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const { notificationId, markAll } = await request.json();
  await prisma.notification.updateMany({
    where: markAll ? { userId, isRead: false } : { id: notificationId, userId },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
