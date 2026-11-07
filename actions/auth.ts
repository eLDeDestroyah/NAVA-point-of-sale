"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { loginUser, registerUser } from "@/services/auth.service";
import type { AuthActionState } from "@/types/user.type";

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

const registerSchema = z
  .object({
    username: z.string().trim().min(3, "Username minimal 3 karakter."),
    email: z.string().trim().email("Format email tidak valid."),
    password: z.string().min(6, "Password minimal 6 karakter."),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  });

export async function loginAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message || "Data login tidak valid.",
    };
  }

  try {
    await loginUser(result.data);
    redirect("/dashboard");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Login gagal, silakan coba lagi.",
    };
  }
}

export async function registerAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const payload = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const result = registerSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message || "Data register tidak valid.",
    };
  }

  try {
    await registerUser(result.data);
    redirect("/login");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Registrasi gagal, silakan coba lagi.",
    };
  }
}
