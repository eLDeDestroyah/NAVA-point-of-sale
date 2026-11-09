import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nava_session")?.value;

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
