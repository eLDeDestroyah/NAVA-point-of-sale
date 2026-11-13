"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Wallet,
} from "lucide-react";

type SidebarUser = {
  username?: string | null;
};

function BarChartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <path d="M7 16V8" />
      <path d="M12 16V4" />
      <path d="M17 16v-6" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Kasir", icon: ShoppingBag, href: "/dashboard/cashier" },
  { label: "Produk", icon: Package, href: "/dashboard/product" },
  { label: "Keuangan", icon: Wallet, href: "/dashboard/finance" },
  { label: "Laporan", icon: BarChartIcon, href: "/dashboard" },
  { label: "Chatbot", icon: MessageSquareText, href: "/dashboard" },
  { label: "Pengaturan", icon: Settings, href: "/dashboard" },
];

export function Sidebar({ currentUser }: { currentUser?: SidebarUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = currentUser?.username?.trim() || "Pengguna";
  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        router.push("/dashboard/cashier");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal logout:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[250px] flex-col border-r border-[#dfe7df] bg-[#f6f3f0] px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d5c4b] text-lg font-black text-white shadow-md shadow-emerald-900/20">
          N
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-black tracking-[0.12em] text-[#0d5c4b]">
            NAVA
          </div>
          <div className="text-[10px] font-medium text-slate-500">POS</div>
        </div>
      </div>

      <div className="mb-6 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Menu utama
      </div>

      <nav className="space-y-2">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive =
            pathname === href || (href === "/dashboard" && pathname === "/dashboard");

          return (
            <Link
              key={label}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition ${
                isActive
                  ? "bg-[#dfeae5] text-[#0d5c4b] shadow-inner shadow-emerald-900/5 font-semibold"
                  : "text-slate-700 hover:bg-white/60 font-medium"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Link
          href="/dashboard/cashier"
          className="flex items-center justify-between rounded-2xl bg-[#dfeae4] px-3 py-3 text-left transition hover:bg-[#d5e4dc]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0d5c4b] shadow-sm">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Kasir cepat</div>
              <div className="text-[11px] text-slate-500">Tekan F2 untuk buka</div>
            </div>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d5c4b] text-[10px] font-bold text-white">
            2
          </div>
        </Link>

        {/* Tombol Logout di bawah Kasir Cepat */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-between rounded-2xl border border-rose-200/80 bg-rose-50/60 px-3.5 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-100/80 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="h-4 w-4 text-rose-600" />
            <span>{isLoggingOut ? "Mengeluarkan..." : "Logout"}</span>
          </div>
          <span className="text-[11px] text-rose-500">Keluar</span>
        </button>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d5c4b] text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">{userName}</div>
              <div className="text-[11px] text-slate-500">Pemilik toko</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            aria-label="Logout"
            disabled={isLoggingOut}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
