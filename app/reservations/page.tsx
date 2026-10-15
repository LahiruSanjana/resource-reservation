import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/app/lib/db";
import { listReservations } from "@/app/lib/services/reservation.service";
import { dayRange, fmtDateTime } from "@/app/lib/time";
import CancelButton from "./cancel-button";

type SearchParams = Promise<{
  resourceId?: string;
  status?: string;
  date?: string;
  page?: string;
}>;

export default function ReservationsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading reservations...</p>}>
      <ReservationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReservationsContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const resources = await prisma.resource.findMany({ orderBy: { name: "asc" } });
  const status = sp.status === "CONFIRMED" || sp.status === "CANCELLED" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const range = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? dayRange(sp.date) : undefined;

  const { items, total, pageSize } = await listReservations({
    resourceId: sp.resourceId ? Number(sp.resourceId) : undefined,
    status,
    from: range?.start,
    to: range?.end,
    page,
    pageSize: 10,
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.resourceId) q.set("resourceId", sp.resourceId);
    if (status) q.set("status", status);
    if (sp.date) q.set("date", sp.date);
    q.set("page", String(p));
    return `/reservations?${q.toString()}`;
  };

  const field = "rounded border px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reservations</h1>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-slate-950 p-4">
        <select name="resourceId" defaultValue={sp.resourceId ?? ""} className={`${field} bg-slate-950 text-white`}>
          <option value="">All resources</option>
          {resources.map((r: any) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={`${field} bg-slate-950 text-white`}>
          <option value="">Any status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input type="date" name="date" defaultValue={sp.date ?? ""} className={`${field} bg-slate-950 text-white`} />
        <button className="rounded bg-white px-4 py-2 text-sm text-black  font-bold">Filter</button>
        <Link href="/reservations" className="px-2 py-2 text-sm underline font-bold">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-slate-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-800 text-white">
            <tr className="hover:bg-slate-900">
              <th className="p-3">Title</th>
              <th className="p-3">Resource</th>
              <th className="p-3">Booked by</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No reservations found.</td></tr>
            )}
            {items.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.resource.name}</td>
                <td className="p-3">{r.user.name}</td>
                <td className="p-3">{fmtDateTime(r.startTime)}</td>
                <td className="p-3">{fmtDateTime(r.endTime)}</td>
                <td className="p-3">
                  <span className={r.status === "CONFIRMED" ? "text-green-700" : "text-gray-400"}>
                    {r.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {r.status === "CONFIRMED" && <CancelButton id={r.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{total} total, page {page} of {pages}</span>
        <div className="space-x-4">
          {page > 1 && <Link href={pageHref(page - 1)} className="underline">Previous</Link>}
          {page < pages && <Link href={pageHref(page + 1)} className="underline">Next</Link>}
        </div>
      </div>
    </div>
  );
}