"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Save, ShieldCheck, UserRound } from "lucide-react";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setUsername(data.user.username);
          setEmail(data.user.email);
          setShopName(data.shop.name);
          setShopAddress(data.shop.address ?? "");
        }
      } catch {
        setMessage("Pengaturan gagal dimuat.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, shopName, shopAddress }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pengaturan gagal disimpan.");
      setMessage("Pengaturan berhasil disimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengaturan gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Konfigurasi akun</div>
        <h1 className="mt-1 text-[28px] font-bold text-slate-800">Pengaturan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold text-slate-800">Akun pemilik</h2><p className="text-xs text-slate-400">Informasi identitas pengguna</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">Nama pengguna
              <input value={username} onChange={(event) => setUsername(event.target.value)} disabled={isLoading} maxLength={50} className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-emerald-600" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">Email
              <input value={email} disabled className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-normal text-slate-500" />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold text-slate-800">Profil toko</h2><p className="text-xs text-slate-400">Informasi yang tampil pada struk dan laporan</p></div>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2 text-sm font-semibold text-slate-700">Nama toko
              <input value={shopName} onChange={(event) => setShopName(event.target.value)} disabled={isLoading} maxLength={80} className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-emerald-600" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">Alamat toko
              <textarea value={shopAddress} onChange={(event) => setShopAddress(event.target.value)} disabled={isLoading} maxLength={180} rows={3} className="block w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-emerald-600" />
            </label>
          </div>
        </section>

        {message && <p className={`text-sm ${message.includes("berhasil") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}

        <div className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Perubahan diterapkan pada akun yang sedang login.</div>
          <button type="submit" disabled={isLoading || isSaving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
