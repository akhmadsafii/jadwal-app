import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";

type Role = "ADMIN" | "EMPLOYEE";

const JWT_SECRET = process.env.JWT_SECRET || "shiftmaster-pro-secret-key-2026";
const JWT_EXPIRY = (process.env.JWT_EXPIRY || "365d") as SignOptions["expiresIn"];

export interface TokenPayload {
  userId: string;
  nip: string;
  name: string;
  role: Role;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}
