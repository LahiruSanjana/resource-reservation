import { prisma } from "@/app/lib/db";
import ResourceManager from "./resource-manager";

export const dynamic = "force-dynamic"; // always read fresh data from the DB

export default async function ResourcesPage() {
  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ResourceManager
      categories={categories}
      resources={resources.map((r) => ({
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