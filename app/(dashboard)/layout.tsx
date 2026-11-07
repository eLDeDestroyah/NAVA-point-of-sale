import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="w-full">{children}</div>
    </main>
  );
}
