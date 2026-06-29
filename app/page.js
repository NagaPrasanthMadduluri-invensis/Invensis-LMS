import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromCookieServer } from "@/services/api/auth/auth-api";

export default async function Home() {
  const cookieStore = await cookies();
  const user = getUserFromCookieServer(cookieStore);

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin")   redirect("/admin/dashboard");
  if (user.role === "trainer") redirect("/trainer/dashboard");

  redirect("/dashboard");
}
