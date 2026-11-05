"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";

import { registerAction } from "@/actions/auth";

const initialState = {
  success: false,
  message: "",
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="w-full max-w-[520px] rounded-[30px] border border-[#e7e4df] bg-[#f5f5f2] p-4 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-6 lg:p-7">
      <div className="rounded-[28px] border border-[#ebebe8] bg-[#f2f2f0] p-6 sm:p-7">
        <div className="mb-7 text-center">
          <div className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Buat akun
          </div>
          <h2 className="mt-3 text-[1.9rem] font-medium tracking-[-0.06em] text-slate-800 lg:text-[2.1rem]">
            Daftar akun NAVA
          </h2>
          <p className="mt-3 text-[0.96rem] text-slate-500">
            Mulai kelola bisnis Anda dengan lebih cepat.
          </p>
        </div>

        <form action={formAction} noValidate className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-[0.98rem] font-medium text-slate-700">
              Username
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
              <UserRound size={18} className="text-slate-400" />
              <input
                id="username"
                name="username"
                type="text"
                placeholder="username Anda"
                autoComplete="username"
                className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[0.98rem] font-medium text-slate-700">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
              <Mail size={18} className="text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-[0.98rem] font-medium text-slate-700">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
              <Lock size={18} className="text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Buat password baru"
                autoComplete="new-password"
                className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-[0.98rem] font-medium text-slate-700">
              Konfirmasi password
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3df] bg-white px-3.5 py-3 shadow-inner shadow-slate-100/80 focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10">
              <Lock size={18} className="text-slate-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                autoComplete="new-password"
                className="w-full border-0 bg-transparent text-[0.95rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan konfirmasi password"
                    : "Tampilkan konfirmasi password"
                }
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {state.message ? (
            <p
              className={`text-sm ${
                state.success ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-3 flex w-full items-center justify-center rounded-2xl bg-[#0d5c4b] px-4 py-3.5 text-[1.02rem] font-medium text-white shadow-[0_18px_28px_rgba(13,92,75,0.28)] transition hover:bg-[#0a4d40] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Memproses..." : "Daftar ke NAVA"}
          </button>

          <div className="pt-1 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-[#0d5c4b] hover:text-[#0a4d40]">
              Masuk sekarang
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
