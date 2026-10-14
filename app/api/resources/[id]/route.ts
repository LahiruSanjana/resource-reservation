import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { NotFoundError, handleError } from "@/app/lib/errors";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  categoryId: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  isActive: z.boolean().optional(), // false = soft deactivate
});

// PATCH /api/resources/3
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.resource.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundError("Resource not found");

    const updated = await prisma.resource.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}