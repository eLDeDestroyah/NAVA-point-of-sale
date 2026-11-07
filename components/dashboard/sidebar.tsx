import {
  ArrowRight,
  LayoutGrid,
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
  { label: "Dashboard", icon: LayoutGrid, active: false },
  { label: "Kasir", icon: ShoppingBag, active: false },
  { label: "Produk", icon: Package, active: true },
  { label: "Keuangan", icon: Wallet, active: false },
  { label: "Laporan", icon: BarChartIcon, active: false },
  { label: "Chatbot", icon: MessageSquareText, active: false },
  { label: "Pengaturan", icon: Settings, active: false },
];

export function Sidebar({ currentUser }: { currentUser?: SidebarUser | null }) {
  const userName = currentUser?.username?.trim() || "Pengguna";
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "U";

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
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition ${
              active
                ? "bg-[#dfeae5] text-[#0d5c4b] shadow-inner shadow-emerald-900/5"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-[#dfeae4] px-3 py-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0d5c4b] shadow-sm">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Kasir cepat</div>
              <div className="text-[11px] text-slate-500">Tekan F2 untuk saja</div>
            </div>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d5c4b] text-[10px] font-bold text-white">
            2
          </div>
        </div>

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
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
