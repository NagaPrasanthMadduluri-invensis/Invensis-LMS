import Box from "@/components/ui/box";
import { VerifyForm } from "@/components/public/verify-form";

export const metadata = {
  title: "Verify Certificate | Invensis Learning",
  description:
    "Verify the authenticity of Certificates of Training issued by Invensis Learning.",
};

/* Reached by scanning the QR printed on a certificate:
   https://portal.invensislearning.com/verify/INVLJA4447 */
export default async function VerifyByCodePage({ params }) {
  const { code } = await params;
  return (
    <Box className="min-h-screen bg-[#f4f6fb]">
      <VerifyForm initialCode={decodeURIComponent(code ?? "")} />
    </Box>
  );
}
