"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime, toUtc } from "@/app/lib/time";

type Props = {
  resourceId: number;
  resourceName: string;
  date: string;
  users: { id: number; name: string }[];
  defaultStart: string;
  defaultEnd: string;
};

export default function BookingForm({
  resourceId, resourceName, date, users, defaultStart, defaultEnd,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState(String(users[0]?.id ?? ""));
  const [bookDate, setBookDate] = useState(date);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConflict(null);
    setSuccess(false);
    setSaving(true);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        userId: Number(userId),
        title,
        startTime: toUtc(bookDate, start).toISOString(),
        endTime: toUtc(bookDate, end).toISOString(),
      }),
    });
    setSaving(false);

    const data = await res.json().catch(() => null);

    if (res.status === 409) {
      const d = data?.details;
      setConflict(
        d
          ? `${data.error}. "${d.title}" is booked by ${d.bookedBy} from ${fmtTime(d.startTime)} to ${fmtTime(d.endTime)}.`
          : data.error
      );
      return;
    }
    if (!res.ok) {
      setError(data?.issues?.[0]?.message ?? data?.error ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    setTitle("");
    if (bookDate !== date) {
      // jump the timeline to the day that was just booked
      router.push(`/availability?resourceId=${resourceId}&date=${bookDate}`);
    } else {
      router.refresh();
    }
  }

  const input = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-slate-950 p-4">
      <h2 className="font-medium">Book {resourceName}</h2>

      <input
        className={input}
        placeholder="Title (e.g. Team meeting)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <select className={`${input} bg-slate-950 text-white`} value={userId} onChange={(e) => setUserId(e.target.value)} required>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-600">Date</span>
        <input type="date" className={input} value={bookDate} onChange={(e) => setBookDate(e.target.value)} required />
      </label>

      <div className="flex gap-3">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-gray-600">Start</span>
          <input type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-gray-600">End</span>
          <input type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} required />
        </label>
      </div>

      {conflict && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">{conflict}</p>}
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded bg-green-50 p-3 text-sm text-green-700">Booked successfully.</p>}

      <button disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white border-2 border-white disabled:opacity-50">
        {saving ? "Booking..." : "Book"}
      </button>
    </form>
  );
}