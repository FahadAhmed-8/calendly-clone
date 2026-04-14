import { createHash } from "crypto";

// The assignment specifies: "No Login Required — assume a default user is logged in
// for the admin side." There's therefore no admin-auth helper here on purpose;
// the only tokens in the system are per-booking cancellation tokens hashed below.

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
