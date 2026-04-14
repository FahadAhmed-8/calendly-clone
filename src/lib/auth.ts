import { AppError } from "./errors";
import { createHash, timingSafeEqual } from "crypto";

export function requireAdmin(req: Request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) throw new AppError("INTERNAL_ERROR", 500, "ADMIN_API_KEY not set");
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token.length !== expected.length) throw new AppError("UNAUTHORIZED", 401, "Invalid admin key");
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (!timingSafeEqual(a, b)) throw new AppError("UNAUTHORIZED", 401, "Invalid admin key");
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function randomToken(bytes = 32) {
  // Browser-compatible base64url via Buffer.
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
