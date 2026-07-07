import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm mode="reset" />
    </Suspense>
  );
}
