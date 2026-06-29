import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromCookieServer } from "@/services/api/auth/auth-api";
import { LearnerShell } from "@/components/layout/learner-shell";

export default async function LearnerLayout({ children }) {
  const cookieStore = await cookies();
  const user = getUserFromCookieServer(cookieStore);

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/admin/dashboard");
  }

  return <LearnerShell user={user}>{children}</LearnerShell>;
}
