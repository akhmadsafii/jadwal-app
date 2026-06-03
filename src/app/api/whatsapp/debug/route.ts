import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  getWhatsAppAdminNumbers,
  normalizeWhatsAppNumber,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

function maskNumber(number: string | null | undefined) {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
}

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

export async function GET(request: Request) {
  const token = getToken(request);
  const decoded = token ? verifyToken(token) : null;

  if (!decoded || decoded.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shouldSendTest = searchParams.get("send") === "1";

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
  const fallbackAdminNumbers = getWhatsAppAdminNumbers();
  const targetNumbers = [
    ...admins.map((admin) => admin.phone),
    ...fallbackAdminNumbers,
  ].filter(Boolean);

  const sendResults = shouldSendTest
    ? await Promise.allSettled(
        targetNumbers.map((number) =>
          sendWhatsAppMessage({
            number,
            message: `Tes notifikasi WhatsApp Jadwal ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
          })
        )
      )
    : [];

  return NextResponse.json({
    success: true,
    env: {
      hasApiKey: Boolean(process.env.WHATSAPP_API_KEY),
      hasSender: Boolean(process.env.WHATSAPP_SENDER),
      sender: maskNumber(process.env.WHATSAPP_SENDER),
      apiUrl: process.env.WHATSAPP_API_URL || "https://whatsapp.notifapp.online/send-message",
    },
    admins: admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      isActive: admin.isActive,
      hasPhone: Boolean(normalizeWhatsAppNumber(admin.phone)),
      phone: maskNumber(admin.phone),
    })),
    fallbackAdminNumbers: fallbackAdminNumbers.map(maskNumber),
    targetCount: targetNumbers.length,
    sendResults: sendResults.map((result, index) => ({
      target: maskNumber(targetNumbers[index]),
      ok: result.status === "fulfilled",
      error: result.status === "rejected" ? String(result.reason) : null,
    })),
  });
}
