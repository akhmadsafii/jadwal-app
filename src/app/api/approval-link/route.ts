import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { generateToken } from "@/lib/auth";
import { verifyApprovalLinkToken } from "@/lib/approvalLinks";
import { PUT as updateAdminRequest } from "@/app/api/requests/update/route";
import { POST as respondToEmployeeSwap } from "@/app/api/requests/respond-swap/route";

function getApprovalToken(request: Request, bodyToken?: string) {
  if (bodyToken) return bodyToken;
  return new URL(request.url).searchParams.get("token") || "";
}

async function getRequestForToken(token: string) {
  const payload = verifyApprovalLinkToken(token);
  if (!payload) return null;

  const shiftRequest = await prisma.shiftRequest.findUnique({
    where: { id: payload.requestId },
    include: {
      user: {
        select: { id: true, name: true, nip: true, position: true },
      },
    },
  });
  if (!shiftRequest) return null;

  const isEmployeeSwap = shiftRequest.type === "TUKAR_SHIFT" && Boolean(shiftRequest.swapWithUserId);
  if (payload.approverRole === "ADMIN" && isEmployeeSwap) return null;
  if (
    payload.approverRole === "EMPLOYEE" &&
    (!isEmployeeSwap || shiftRequest.swapWithUserId !== payload.approverUserId)
  ) return null;

  const swapWithUser = shiftRequest.swapWithUserId
    ? await prisma.user.findUnique({
        where: { id: shiftRequest.swapWithUserId },
        select: { id: true, name: true, nip: true, position: true },
      })
    : null;

  return { payload, shiftRequest, swapWithUser };
}

function validateLoggedInUser(
  request: Request,
  payload: NonNullable<Awaited<ReturnType<typeof getRequestForToken>>>["payload"]
) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return { authUser: null, error: null };

  const authUser = getAuthUser(request);
  if (!authUser) {
    return {
      authUser: null,
      error: NextResponse.json({ error: "Sesi login tidak valid. Silakan login ulang." }, { status: 401 }),
    };
  }
  if (authUser.role !== payload.approverRole) {
    return {
      authUser,
      error: NextResponse.json({ error: "Akun yang sedang login tidak berhak menindaklanjuti pengajuan ini." }, { status: 403 }),
    };
  }
  if (payload.approverUserId && authUser.userId !== payload.approverUserId) {
    return {
      authUser,
      error: NextResponse.json({ error: "Link ini ditujukan untuk pegawai lain." }, { status: 403 }),
    };
  }
  return { authUser, error: null };
}

export async function GET(request: Request) {
  const approval = await getRequestForToken(getApprovalToken(request));
  if (!approval) {
    return NextResponse.json(
      { error: "Link approval tidak valid atau sudah kedaluwarsa." },
      { status: 401 }
    );
  }

  const session = validateLoggedInUser(request, approval.payload);
  if (session.error) return session.error;

  return NextResponse.json({
    success: true,
    approverRole: approval.payload.approverRole,
    loggedInAs: session.authUser
      ? { userId: session.authUser.userId, name: session.authUser.name, role: session.authUser.role }
      : null,
    request: {
      id: approval.shiftRequest.id,
      type: approval.shiftRequest.type,
      startDate: approval.shiftRequest.startDate,
      endDate: approval.shiftRequest.endDate,
      description: approval.shiftRequest.description,
      status: approval.shiftRequest.status,
      createdAt: approval.shiftRequest.createdAt,
      requester: approval.shiftRequest.user,
      swapWithUser: approval.swapWithUser,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    token?: string;
    decision?: "APPROVED" | "REJECTED";
  };
  if (!body.decision || !["APPROVED", "REJECTED"].includes(body.decision)) {
    return NextResponse.json({ error: "Keputusan tidak valid." }, { status: 400 });
  }

  const approval = await getRequestForToken(getApprovalToken(request, body.token));
  if (!approval) {
    return NextResponse.json(
      { error: "Link approval tidak valid atau sudah kedaluwarsa." },
      { status: 401 }
    );
  }

  const session = validateLoggedInUser(request, approval.payload);
  if (session.error) return session.error;
  if (approval.shiftRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: `Pengajuan ini sudah berstatus ${approval.shiftRequest.status}.` },
      { status: 409 }
    );
  }

  let actingUser = session.authUser;
  if (!actingUser && approval.payload.approverRole === "ADMIN") {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, nip: true, name: true, role: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin aktif tidak ditemukan." }, { status: 503 });
    actingUser = {
      userId: admin.id,
      nip: admin.nip,
      name: admin.name,
      role: "ADMIN",
    };
  }

  if (!actingUser && approval.payload.approverRole === "EMPLOYEE") {
    const employee = await prisma.user.findFirst({
      where: {
        id: approval.payload.approverUserId,
        role: "EMPLOYEE",
        isActive: true,
      },
      select: { id: true, nip: true, name: true, role: true },
    });
    if (!employee) return NextResponse.json({ error: "Pegawai tujuan tidak ditemukan." }, { status: 404 });
    actingUser = {
      userId: employee.id,
      nip: employee.nip,
      name: employee.name,
      role: "EMPLOYEE",
    };
  }

  if (!actingUser) {
    return NextResponse.json({ error: "Identitas pemberi keputusan tidak ditemukan." }, { status: 401 });
  }

  const delegatedToken = generateToken(actingUser);
  const delegatedRequest = new Request(request.url, {
    method: approval.payload.approverRole === "ADMIN" ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${delegatedToken}`,
    },
    body: JSON.stringify(
      approval.payload.approverRole === "ADMIN"
        ? {
            requestId: approval.shiftRequest.id,
            status: body.decision,
            adminNotes: "Ditindaklanjuti melalui link WhatsApp.",
          }
        : {
            requestId: approval.shiftRequest.id,
            decision: body.decision,
          }
    ),
  });

  return approval.payload.approverRole === "ADMIN"
    ? updateAdminRequest(delegatedRequest)
    : respondToEmployeeSwap(delegatedRequest);
}
