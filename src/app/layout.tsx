import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Native AI Brokerage — Broker Platform",
  description: "AI-native operating system for the commercial broker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f0ede8] text-[#0d1117] font-['DM_Sans',sans-serif] min-h-screen">
        <nav className="bg-[#0d1117] text-white px-6 py-4 flex items-center justify-between">
          <a href="/deals" className="text-lg font-semibold tracking-tight">Native AI <span className="text-[#94b4fb]">Brokerage</span></a>
          <div className="flex gap-6 items-center text-sm">
            <a href="/deals" className="text-white/70 hover:text-white transition">Deals</a>
            <a href="/deals/new" className="bg-[#2462F5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1b4fd4] transition">+ New Deal</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
