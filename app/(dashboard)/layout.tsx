import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUserProfile } from "@/services/auth.service";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("nava_session")?.value;

  if (!session) {
    redirect("/login");
  }

  let currentUser = null;
  try {
    currentUser = await getCurrentUserProfile();
  } catch (error) {
    console.error("Gagal memuat profil pengguna di layout:", error);
  }

  return (
    <div className="min-h-screen w-full bg-[#f3f3f1] text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar currentUser={currentUser} />
        <main className="ml-[250px] min-h-screen flex-1 p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
