"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { loginUser, registerUser } from "@/services/auth.service";
import type { AuthActionState } from "@/types/user.type";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 254) return false;
  if (trimmed.includes(" ")) return false;

  const [localPart, ...domainParts] = trimmed.split("@");

  if (!localPart || domainParts.length !== 1 || !domainParts[0]) return false;

  const domain = domainParts[0];
  const domainSegments = domain.split(".");

  if (domainSegments.length < 2) return false;
  if (domainSegments.some((segment) => segment.length === 0)) return false;

  const localPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  const domainPattern = /^[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;

  return localPattern.test(localPart) && domainPattern.test(domain);
};

const loginSchema = z.object({
  email: z
    .string()
    .transform(normalizeEmail)
    .refine(isValidEmail, "Format email tidak valid."),
  password: z.string().trim().min(6, "Password minimal 6 karakter."),
});

const registerSchema = z
  .object({
    username: z.string().trim().min(3, "Username minimal 3 karakter."),
    email: z
      .string()
      .transform(normalizeEmail)
      .refine(isValidEmail, "Format email tidak valid."),
    password: z.string().trim().min(6, "Password minimal 6 karakter."),
    confirmPassword: z.string().trim().min(6, "Konfirmasi password minimal 6 karakter."),
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
