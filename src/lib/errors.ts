import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SLUG_TAKEN"
  | "SLOT_TAKEN"
  | "HAS_FUTURE_BOOKINGS"
  | "ALREADY_CANCELLED"
  | "OUTSIDE_AVAILABILITY"
  | "OVERLAPPING_RULES"
  | "INVALID_TOKEN"
  | "LAST_SCHEDULE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(public code: ErrorCode, public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.flatten() } },
      { status: 400 },
    );
  }
  console.error(err);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
}
