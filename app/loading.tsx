export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0d5c4b]" />
        <p className="text-sm font-medium text-slate-600">Memuat...</p>
      </div>
    </div>
  );
}
