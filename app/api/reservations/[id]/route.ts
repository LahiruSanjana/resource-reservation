import { NextResponse } from "next/server";
import { handleError } from "@/app/lib/errors";
import { cancelReservation } from "../../../lib/services/reservation.service";

// DELETE /api/reservations/5  -> soft cancel (keeps history)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // in new Next.js, params is a Promise
    const reservation = await cancelReservation(Number(id));
    return NextResponse.json(reservation);
  } catch (e) {
    return handleError(e);
  }
}