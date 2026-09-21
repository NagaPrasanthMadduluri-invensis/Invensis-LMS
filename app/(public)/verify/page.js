import Box from "@/components/ui/box";
import { VerifyForm } from "@/components/public/verify-form";

export const metadata = {
  title: "Verify Certificate | Invensis Learning",
  description:
    "Verify the authenticity of Certificates of Training issued by Invensis Learning.",
};

export default function VerifyPage() {
  return (
    <Box className="min-h-screen bg-[#f4f6fb]">
      <VerifyForm />
    </Box>
  );
}
