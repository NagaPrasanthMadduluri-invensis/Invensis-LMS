import Box from "@/components/ui/box";
import { VerifyByCode } from "@/components/public/verify-by-code";

export const metadata = {
  title: "Verify Certificate | Invensis Learning",
  description:
    "Verify the authenticity of Certificates of Training issued by Invensis Learning.",
};

/* Reached by scanning the QR printed on a certificate:
   https://portal.invensislearning.com/verify/INVLJA4447
   The code is already in the URL, so this goes straight to the result rather
   than presenting the search form again. */
export default async function VerifyByCodePage({ params }) {
  const { code } = await params;
  return (
    <Box className="min-h-screen bg-[#f4f6fb]">
      <VerifyByCode code={decodeURIComponent(code ?? "")} />
    </Box>
  );
}
