export default function DashboardPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Dashboard
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900">
        Selamat datang di NAVA
      </h1>
      <p className="mt-3 text-slate-600">
        Login berhasil melalui Supabase PostgREST.
      </p>
    </div>
  );
}
