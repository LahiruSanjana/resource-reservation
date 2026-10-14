import { NextResponse } from "next/server";

export class ValidationError extends Error {}
export class NotFoundError extends Error {}

export class ConflictError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
  }
}

// Map our typed errors -> HTTP status codes (one place, used by every route)
export function handleError(e: unknown) {
  if (e instanceof ValidationError)
    return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof NotFoundError)
    return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ConflictError)
    return NextResponse.json({ error: e.message, details: e.details }, { status: 409 });

  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}