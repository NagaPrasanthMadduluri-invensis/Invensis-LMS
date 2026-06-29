import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromCookieServer } from "@/services/api/auth/auth-api";
import { TrainerShell } from "@/components/layout/trainer-shell";

export default async function TrainerLayout({ children }) {
  const cookieStore = await cookies();
  const user = getUserFromCookieServer(cookieStore);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "trainer") {
    if (user.role === "admin") redirect("/admin/dashboard");
    else redirect("/dashboard");
  }

  return <TrainerShell>{children}</TrainerShell>;
}
