import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase";
import type { LoginInput, RegisterInput } from "@/types/user.type";

const SESSION_COOKIE_NAME = "nava_session";

async function createSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function registerUser(input: RegisterInput) {
  const supabase = await getSupabaseServerClient();

  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();

  const { data: existingUsers, error: existingError } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`)
    .limit(1);

  if (existingError) {
    throw new Error("Gagal memeriksa data pengguna.");
  }

  if ((existingUsers ?? []).length > 0) {
    throw new Error("Email atau username sudah terdaftar.");
  }

  const hashedPassword = await hash(input.password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      email,
      password: hashedPassword,
      membership: false,
    })
    .select("id, username, email, membership, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Registrasi gagal.");
  }

  await createSession(data.id);

  return data;
}

export async function loginUser(input: LoginInput) {
  const supabase = await getSupabaseServerClient();

  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, password, membership, created_at")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error("Email atau password salah.");
  }

  const isPasswordValid = await compare(input.password, data.password);

  if (!isPasswordValid) {
    throw new Error("Email atau password salah.");
  }

  const safeUser = {
    id: data.id,
    username: data.username,
    email: data.email,
    membership: data.membership,
    created_at: data.created_at,
  };

  await createSession(safeUser.id);

  return safeUser;
}

export async function getCurrentUserProfile() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, membership, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Gagal memuat profil pengguna.");
  }

  return data
    ? {
        id: data.id,
        username: data.username,
        email: data.email,
        membership: data.membership,
        created_at: data.created_at,
      }
    : null;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
