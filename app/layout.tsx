import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Reservations",
  description: "Book shared rooms, equipment and vehicles without double-booking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-gray-900">
        <header className="border-b bg-slate-900">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
            <span className="font-semibold">ReserveIt</span>
            <Link href="/availability" className="hover:underline">Availability</Link>
            <Link href="/reservations" className="hover:underline">Reservations</Link>
            <Link href="/resources" className="hover:underline">Resources</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}