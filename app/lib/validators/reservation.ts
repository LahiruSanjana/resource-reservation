import { z } from "zod";

export const MAX_DURATION_HOURS = 8;

export const createReservationSchema = z.object({
  resourceId: z.number().int().positive(),
  userId: z.number().int().positive(), // temporary: no auth yet
  title: z.string().trim().min(1, "Title is required").max(120),
  notes: z.string().max(500).optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;