import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/app/lib/db";
import { dayRange, fmtTime, todayStr } from "@/app/lib/time";
import BookingForm from "./booking-form";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 20:00

type SearchParams = Promise<{ resourceId?: string; date?: string; start?: string }>;

export default function AvailabilityPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading availability...</p>}>
      <AvailabilityContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AvailabilityContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const [resources, users] = await Promise.all([
    prisma.resource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (resources.length === 0) {
    return <p className="text-gray-500">No active resources. Add one on the Resources page.</p>;
  }

  const resource = resources.find((r: any) => r.id === Number(sp.resourceId)) ?? resources[0];
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayStr();
  const { start, end } = dayRange(date);

  const bookings = await prisma.reservation.findMany({
    where: {
      resourceId: resource.id,
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  const slots = HOURS.map((h) => {
    const slotStart = new Date(start.getTime() + h * 36e5);
    const slotEnd = new Date(slotStart.getTime() + 36e5);
    const booking = bookings.find((b: any) => b.startTime < slotEnd && b.endTime > slotStart);
    return { h, label: `${String(h).padStart(2, "0")}:00`, booking };
  });

  const link = (h: number) =>
    `/availability?resourceId=${resource.id}&date=${date}&start=${h}`;

  const startHour = sp.start ? Number(sp.start) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-slate-950 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-white">Resource</span>
          <select name="resourceId" defaultValue={resource.id} className="rounded border px-3 py-2 bg-slate-950 text-white">
            {resources.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-white">Date</span>
          <input type="date" name="date" defaultValue={date} className="rounded border px-3 py-2" />
        </label>
        <button className="rounded bg-white px-4 py-2 text-sm text-black font-bold">Show</button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border bg-slate-950">
          {slots.map(({ h, label, booking }) =>
            booking ? (
              <div key={h} className="flex items-center gap-3 border-b bg-slate-950 px-4 py-3 text-sm last:border-0">
                <span className="w-12 text-gray-500">{label}</span>
                <span className="font-medium text-red-700">{booking.title}</span>
                <span className="text-gray-500">
                  {booking.user.name} ({fmtTime(booking.startTime)}-{fmtTime(booking.endTime)})
                </span>
              </div>
            ) : (
              <Link
                key={h}
                href={link(h)}
                className="flex items-center gap-3 border-b bg-slate-950 px-4 py-3 text-sm last:border-0 hover:bg-green-100"
              >
                <span className="w-12 text-white">{label}</span>
                <span className="text-green-700">Free, click to book</span>
              </Link>
            )
          )}
        </div>

        <BookingForm
          key={`${resource.id}-${date}-${startHour ?? "none"}`}
          resourceId={resource.id}
          resourceName={resource.name}
          date={date}
          users={users}
          defaultStart={startHour !== undefined ? `${pad(startHour)}:00` : "09:00"}
          defaultEnd={startHour !== undefined ? `${pad(startHour + 1)}:00` : "10:00"}
        />
      </div>
    </div>
  );
}