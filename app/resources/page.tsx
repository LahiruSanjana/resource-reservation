import { Suspense } from "react";
import { prisma } from "@/app/lib/db";
import ResourceManager from "./resource-manager";

async function ResourcesContent() {
  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ResourceManager
      categories={categories}
      resources={resources.map((r: any) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        location: r.location,
        isActive: r.isActive,
        categoryId: r.categoryId,
        categoryName: r.category.name,
      }))}
    />
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<p className="text-black">Loading...</p>}>
      <ResourcesContent />
    </Suspense>
  );
}