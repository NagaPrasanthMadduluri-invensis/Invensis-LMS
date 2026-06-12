import Box from "@/components/ui/box";

export default function AuthLayout({ children }) {
  return (
    <Box className="min-h-screen">
      {children}
    </Box>
  );
}
