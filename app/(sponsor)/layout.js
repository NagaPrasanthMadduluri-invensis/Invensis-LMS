import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromCookieServer } from "@/services/api/auth/auth-api";
import { SponsorShell } from "@/components/layout/sponsor-shell";

export default async function SponsorLayout({ children }) {
  const cookieStore = await cookies();
  const user = getUserFromCookieServer(cookieStore);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "sponsor") {
    if (user.role === "admin")   redirect("/admin/dashboard");
    if (user.role === "trainer") redirect("/trainer/dashboard");
    redirect("/dashboard");
  }

  return <SponsorShell user={user}>{children}</SponsorShell>;
}
