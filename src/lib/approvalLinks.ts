import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

type ApprovalRole = "ADMIN" | "EMPLOYEE";

export interface ApprovalLinkPayload {
  purpose: "REQUEST_APPROVAL";
  requestId: string;
  approverUserId?: string;
  approverRole: ApprovalRole;
}

const JWT_SECRET = process.env.JWT_SECRET || "shiftmaster-pro-secret-key-2026";
const APPROVAL_LINK_EXPIRY = (process.env.APPROVAL_LINK_EXPIRY || "7d") as SignOptions["expiresIn"];

export function createApprovalLinkToken(
  payload: Omit<ApprovalLinkPayload, "purpose">
) {
  return jwt.sign(
    { ...payload, purpose: "REQUEST_APPROVAL" },
    JWT_SECRET,
    { expiresIn: APPROVAL_LINK_EXPIRY }
  );
}

export function verifyApprovalLinkToken(token: string): ApprovalLinkPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ApprovalLinkPayload;
    return payload.purpose === "REQUEST_APPROVAL" ? payload : null;
  } catch {
    return null;
  }
}

export function getAppBaseUrl(request: Request) {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin)
    .replace(/\/+$/, "");
}

export function createApprovalLink(request: Request, token: string) {
  return `${getAppBaseUrl(request)}/approval/${encodeURIComponent(token)}`;
}
