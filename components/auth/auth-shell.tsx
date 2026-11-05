import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f5f2] text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[1.16fr_0.84fr] xl:grid-cols-[1.2fr_0.8fr]">
        <section className="relative flex min-h-[52vh] overflow-hidden bg-[#0b4e45] px-8 py-8 sm:px-10 lg:min-h-screen lg:px-12 lg:py-8 xl:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.10),_transparent_35%),linear-gradient(135deg,#0d5b4e_0%,#0a4a41_100%)]" />
          <div className="absolute -left-12 top-12 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-72 w-72 rounded-full bg-[#1e7a69]/40 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-bold text-white">
                  N
                </div>
                <span className="text-[1.9rem] font-medium tracking-[-0.08em] text-white">NAVA</span>
              </div>

              <button
                type="button"
                aria-label="Toggle theme"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 shadow-inner shadow-white/5"
              >
                ☼
              </button>
            </div>

            <div className="max-w-[520px] pb-16 pt-16 lg:pt-20 xl:pt-24">
              <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.18em] text-white/80">
                POS + PEMBUKUAN PINTAR
              </div>

              <h1 className="text-[2rem] font-medium leading-[0.96] tracking-[-0.08em] text-white sm:text-[2.6rem] lg:text-[3.2rem] xl:text-[3.7rem]">
                Pahami Toko,
                <span className="mt-2 block">Kendalikan Bisnis.</span>
              </h1>

              <p className="mt-5 max-w-[460px] text-[0.96rem] leading-7 text-emerald-50/90 xl:text-[1rem]">
                Kasir lebih cepat, stok lebih rapi, dan keputusan bisnis lebih cepat
                dengan bantuan AI.
              </p>

              <ul className="mt-6 space-y-3 text-[0.98rem] text-emerald-50/95 xl:text-[1rem]">
                {[
                  "Transaksi cepat & praktis",
                  "Pembukuan otomatis",
                  "Insight bisnis dari NAVA AI",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d9f5eb] text-[#0d5c4b]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-8 pb-2 text-white/90 xl:gap-10">
              <div>
                <div className="text-[1.8rem] font-medium tracking-[-0.06em] xl:text-[2.1rem]">12.000+</div>
                <div className="mt-1 text-[0.9rem] text-emerald-50/80 xl:text-[0.95rem]">Transaksi diproses</div>
              </div>
              <div>
                <div className="text-[1.8rem] font-medium tracking-[-0.06em] xl:text-[2.1rem]">99,9%</div>
                <div className="mt-1 text-[0.9rem] text-emerald-50/80 xl:text-[0.95rem]">Data tersimpan aman</div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#f5f5f2] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}
