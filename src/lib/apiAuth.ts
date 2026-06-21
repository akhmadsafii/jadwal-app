import { NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/auth";

export function getAuthUser(request: Request): TokenPayload | null {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token ? verifyToken(token) : null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
}
