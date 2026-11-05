import { Check, Mail, Lock, SunMedium } from "lucide-react";

const points = [
  "Transaksi cepat & praktis",
  "Pembukuan otomatis",
  "Insight bisnis dari NAVA AI",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f2] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <section className="relative flex min-h-[52vh] flex-1 items-center overflow-hidden bg-[#0b4e45] px-8 py-8 sm:px-10 md:px-12 lg:min-h-screen lg:px-12 xl:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.10),_transparent_35%),linear-gradient(135deg,#0d5b4e_0%,#0a4a41_100%)]" />
          <div className="absolute -left-16 top-12 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-72 w-72 rounded-full bg-[#1e7a69]/40 blur-3xl" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-bold text-white">
                  N
                </div>
                <span className="text-[2rem] font-black tracking-[-0.08em] text-white">NAVA</span>
              </div>

              <button
                type="button"
                aria-label="Dark mode"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 shadow-inner shadow-white/5"
              >
                <SunMedium size={18} />
              </button>
            </div>

            <div className="max-w-[520px] pb-16 pt-14 lg:pb-10 lg:pt-16">
              <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                POS + PEMBUKUAN PINTAR
              </div>

              <h1 className="text-[2.2rem] font-black leading-[0.96] tracking-[-0.08em] text-white sm:text-[2.7rem] lg:text-[3.5rem] xl:text-[4rem]">
                Pahami Toko,
                <span className="mt-2 block">Kendalikan Bisnis.</span>
              </h1>

              <p className="mt-5 max-w-[470px] text-[0.96rem] leading-7 text-emerald-50/90">
                Kasir lebih cepat, stok lebih rapi, dan keputusan bisnis lebih cepat
                dengan bantuan AI.
              </p>

              <ul className="mt-6 space-y-3 text-[0.98rem] text-emerald-50/95">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d9f5eb] text-[#0d5c4b]">
                      <Check size={12} className="stroke-[3]" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-8 pb-2 text-white/90">
              <div>
                <div className="text-[2rem] font-black tracking-[-0.06em]">12.000+</div>
                <div className="mt-1 text-[0.9rem] text-emerald-50/80">Transaksi diproses</div>
              </div>
              <div>
                <div className="text-[2rem] font-black tracking-[-0.06em]">99,9%</div>
                <div className="mt-1 text-[0.9rem] text-emerald-50/80">Data tersimpan aman</div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-[#f5f5f2] px-4 py-8 sm:px-6 lg:min-h-screen lg:px-10">
          <div className="w-full max-w-[520px] rounded-[30px] border border-[#e7e4df] bg-[#f5f5f2] p-4 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-6 lg:p-7">
            <div className="rounded-[28px] border border-[#ebebe8] bg-[#f2f2f0] p-6 sm:p-7">
              <div className="mb-7 text-center">
                <div className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Selamat datang
                </div>
                <h2 className="mt-3 text-[2rem] font-black tracking-[-0.06em] text-slate-800 lg:text-[2.2rem]">
                  Masuk ke tokomu
                </h2>
                <p className="mt-3 text-[0.96rem] text-slate-500">
                  Kelola semua kebutuhan toko dari satu tempat.
                </p>
              </div>

              <form className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[0.98rem] font-medium text-slate-700">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="andi@navamart.id"
                      className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[0.98rem] font-medium text-slate-700">
                    Kata sandi
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 text-sm text-slate-500">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#0d5c4b] focus:ring-[#0d5c4b]" />
                    Ingat saya
                  </label>

                  <button type="button" className="font-medium text-slate-600 hover:text-slate-900">
                    Lupa kata sandi?
                  </button>
                </div>

                <button
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center rounded-2xl bg-[#0d5c4b] px-4 py-3.5 text-[1.02rem] font-bold text-white shadow-[0_18px_28px_rgba(13,92,75,0.28)] transition hover:bg-[#0a4d40]"
                >
                  Masuk ke NAVA
                </button>

                <div className="pt-1 text-center text-sm text-slate-500">
                  Belum punya akun?{" "}
                  <a href="#" className="font-semibold text-[#0d5c4b] hover:text-[#0a4d40]">
                    Daftar gratis
                  </a>
                </div>

                <div className="pt-1 text-center text-xs text-slate-400">
                  Data toko terenkripsi dan terlindungi
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
