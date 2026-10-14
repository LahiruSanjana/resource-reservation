import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  return NextResponse.json(
    await prisma.user.findMany({ select: { id: true, name: true, role: true } })
  );
}
