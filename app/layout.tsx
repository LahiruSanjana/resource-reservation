import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logo from "../asset/logo.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Reservations",
  description: "Book shared rooms, equipment and vehicles without double-booking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-green-950 text-white">
        <header className="border-b bg-black h-1/5">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
            <div className="flex-1 text-lg font-bold">
              <Image
                src={logo}
                alt="ReserveIt"
                width={100}
                height={100}
                className="h-12 w-12 object-contain"
              />
            </div>
            <Link href="/availability" className="hover:underline">Availability</Link>
            <Link href="/reservations" className="hover:underline">Reservations</Link>
            <Link href="/resources" className="hover:underline">Resources</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl my-8 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}