import { NextResponse } from "next/server";
import { handleError } from "@/app/lib/errors";
import { createReservationSchema } from "@/app/lib/validators/reservation";
import { createReservation, listReservations } from "@/app/lib/services/reservation.service";

// GET /api/reservations?resourceId=2&status=CONFIRMED&from=2026-10-15&to=2026-10-16&page=1
export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const status = p.get("status");

    const result = await listReservations({
      resourceId: p.get("resourceId") ? Number(p.get("resourceId")) : undefined,
      status: status === "CONFIRMED" || status === "CANCELLED" ? status : undefined,
      from: p.get("from") ? new Date(p.get("from")!) : undefined,
      to: p.get("to") ? new Date(p.get("to")!) : undefined,
      page: Math.max(1, Number(p.get("page")) || 1),
      pageSize: Math.min(100, Number(p.get("pageSize")) || 20),
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/reservations
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const reservation = await createReservation(parsed.data);
    return NextResponse.json(reservation, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}