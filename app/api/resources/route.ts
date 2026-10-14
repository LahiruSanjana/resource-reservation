import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/db";

// GET /api/resources
export async function GET() {
  const resources = await prisma.resource.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(resources);
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryId: z.number().int().positive(),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
});

// POST /api/resources
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.create({ data: parsed.data });
  return NextResponse.json(resource, { status: 201 });
}