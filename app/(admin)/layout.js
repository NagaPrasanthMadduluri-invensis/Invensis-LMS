import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromCookieServer } from "@/services/api/auth/auth-api";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const user = getUserFromCookieServer(cookieStore);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
