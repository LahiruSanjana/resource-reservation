"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };
type ResourceRow = {
  id: number;
  name: string;
  capacity: number | null;
  location: string | null;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
};

const emptyForm = { name: "", categoryId: "", capacity: "", location: "" };

export default function ResourceManager({
  resources,
  categories,
}: {
  resources: ResourceRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // when editing, send null to clear a field; when creating, just omit it
    const empty = editingId ? null : undefined;
    const payload = {
      name: form.name,
      categoryId: Number(form.categoryId),
      capacity: form.capacity ? Number(form.capacity) : empty,
      location: form.location || empty,
    };

    const res = await fetch(
      editingId ? `/api/resources/${editingId}` : "/api/resources",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.issues?.[0]?.message ?? data?.error ?? "Something went wrong");
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    router.refresh(); // re-runs the server component -> table updates
  }

  async function toggleActive(r: ResourceRow) {
    await fetch(`/api/resources/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    router.refresh();
  }

  function startEdit(r: ResourceRow) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      categoryId: String(r.categoryId),
      capacity: r.capacity ? String(r.capacity) : "",
      location: r.location ?? "",
    });
  }

  const input = "rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Resources</h1>

      <form onSubmit={submit} className="space-y-3 rounded-lg border bg-slate-950 p-4">
        <h2 className="font-medium">{editingId ? "Edit resource" : "Add resource"}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            className={input}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            className={`${input} bg-slate-950 text-white`}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            <option value="">Category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            min={1}
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
          <input
            className={input}
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-sm text-white border-amber-50 border-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add resource"}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              onClick={() => { setEditingId(null); setForm(emptyForm); }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-slate-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-900 text-gray-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No resources yet.</td></tr>
            )}
            {resources.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.categoryName}</td>
                <td className="p-3">{r.capacity ?? "-"}</td>
                <td className="p-3">{r.location ?? "-"}</td>
                <td className="p-3">
                  <span className={r.isActive ? "text-green-700" : "text-gray-400"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="space-x-3 p-3 text-right">
                  <button className="underline" onClick={() => startEdit(r)}>Edit</button>
                  <button className="underline" onClick={() => toggleActive(r)}>
                    {r.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}