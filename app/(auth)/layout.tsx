import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("nava_session")?.value;

  if (session) {
    redirect("/dashboard");
  }

  return <AuthShell>{children}</AuthShell>;
}
