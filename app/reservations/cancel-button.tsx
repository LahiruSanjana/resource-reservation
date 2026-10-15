"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("Cancel this reservation?")) return;
    setLoading(true);
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={cancel} disabled={loading} className="text-red-600 underline disabled:opacity-50">
      {loading ? "Cancelling..." : "Cancel"}
    </button>
  );
}