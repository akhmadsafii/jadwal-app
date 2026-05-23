import jwt from "jsonwebtoken";

type Role = "ADMIN" | "EMPLOYEE";

const JWT_SECRET = process.env.JWT_SECRET || "shiftmaster-pro-secret-key-2026";
const JWT_EXPIRY = "7d";

export interface TokenPayload {
  id: string;
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
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateResetToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}