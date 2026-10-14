import { prisma } from "@/app/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/app/lib/errors";
import {
  CreateReservationInput,
  MAX_DURATION_HOURS,
} from "@/app/lib/validators/reservation";

// Did Postgres reject this because of our exclusion constraint?
function isOverlapError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("no_overlapping_reservations") ||
    msg.includes("23P01") ||
    msg.includes("exclusion constraint")
  );
}

export async function createReservation(input: CreateReservationInput) {
  const { resourceId, userId, startTime, endTime } = input;

  // 1. Rules that don't need the DB
  if (endTime <= startTime)
    throw new ValidationError("End time must be after start time");
  if (startTime < new Date())
    throw new ValidationError("Cannot book a time in the past");
  const hours = (endTime.getTime() - startTime.getTime()) / 36e5;
  if (hours > MAX_DURATION_HOURS)
    throw new ValidationError(`Maximum booking length is ${MAX_DURATION_HOURS} hours`);

  // 2. Resource must exist and be active
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new NotFoundError("Resource not found");
  if (!resource.isActive) throw new ValidationError("Resource is not available for booking");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  // 3. Friendly pre-check: tell the user WHO has the slot.
  //    Overlap rule: existing.start < new.end AND existing.end > new.start
  const clash = await prisma.reservation.findFirst({
    where: {
      resourceId,
      status: "CONFIRMED",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: { user: { select: { name: true } } },
  });
  if (clash) {
    throw new ConflictError("This resource is already booked for that time", {
      title: clash.title,
      bookedBy: clash.user.name,
      startTime: clash.startTime,
      endTime: clash.endTime,
    });
  }

  // 4. The real protection: the DB constraint. Two requests can pass step 3
  //    at the same moment, but only one INSERT can succeed.
  try {
    return await prisma.reservation.create({ data: input });
  } catch (e) {
    if (isOverlapError(e))
      throw new ConflictError("This resource was just booked by someone else");
    throw e;
  }
}

export async function cancelReservation(id: number) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Reservation not found");
  if (existing.status === "CANCELLED")
    throw new ValidationError("Reservation is already cancelled");

  return prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

export async function listReservations(filters: {
  resourceId?: number;
  status?: "CONFIRMED" | "CANCELLED";
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}) {
  const where = {
    ...(filters.resourceId && { resourceId: filters.resourceId }),
    ...(filters.status && { status: filters.status }),
    // reservations that touch the [from, to) window
    ...(filters.to && { startTime: { lt: filters.to } }),
    ...(filters.from && { endTime: { gt: filters.from } }),
  };

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        resource: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.reservation.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}