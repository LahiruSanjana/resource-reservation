import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// helper: a date `days` from today at `hour`:00 UTC
function at(days: number, hour: number) {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  // clear in the right order (children first)
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [rooms, equipment, vehicles] = await Promise.all([
    prisma.category.create({ data: { name: "Meeting Room" } }),
    prisma.category.create({ data: { name: "Equipment" } }),
    prisma.category.create({ data: { name: "Vehicle" } }),
  ]);

  const alice = await prisma.user.create({
    data: { name: "Alice Perera", email: "alice@example.com", role: "ADMIN" },
  });
  const bob = await prisma.user.create({
    data: { name: "Bob Silva", email: "bob@example.com" },
  });

  const boardroom = await prisma.resource.create({
    data: { name: "Boardroom", categoryId: rooms.id, capacity: 12, location: "Floor 3" },
  });
  await prisma.resource.create({
    data: { name: "Huddle Room", categoryId: rooms.id, capacity: 4, location: "Floor 1" },
  });
  const projector = await prisma.resource.create({
    data: { name: "Projector", categoryId: equipment.id },
  });
  await prisma.resource.create({
    data: { name: "Company Van", categoryId: vehicles.id, capacity: 8 },
  });

  await prisma.reservation.createMany({
    data: [
      { resourceId: boardroom.id, userId: alice.id, title: "Sprint Planning", startTime: at(1, 4), endTime: at(1, 6) },
      { resourceId: boardroom.id, userId: bob.id, title: "Client Call", startTime: at(1, 8), endTime: at(1, 9) },
      { resourceId: projector.id, userId: bob.id, title: "Demo Day", startTime: at(2, 5), endTime: at(2, 7) },
    ],
  });

  console.log("Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());