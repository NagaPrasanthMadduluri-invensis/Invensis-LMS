import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm mode="setup" />
    </Suspense>
  );
}
