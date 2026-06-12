"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/providers/auth-provider";
import { CheckCircle2, GraduationCap } from "lucide-react";

const FEATURES = [
  "500+ professional certification courses",
  "Expert instructors from top global firms",
  "PMI & ISO accredited programs",
  "Learn at your own pace, anywhere",
];

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      if (err.errors) setFieldErrors(err.errors);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <Box className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)" }}>
        <Box className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <Box className="flex items-center gap-3 relative z-10">
          <Box className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-violet to-brand-deep flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </Box>
          <Text as="span" className="text-white font-bold text-lg tracking-tight">
            Invensis LMS
          </Text>
        </Box>

        {/* Main copy */}
        <Box className="relative z-10 space-y-6">
          <Box>
            <Text as="h1" className="text-4xl font-bold text-white leading-tight">
              Learn. Grow.
              <Text as="span" className="block bg-gradient-to-r from-brand-gold to-brand-bronze bg-clip-text text-transparent">
                Lead.
              </Text>
            </Text>
            <Text as="p" className="mt-4 text-white/60 text-base leading-relaxed">
              Your gateway to world-class professional certifications and career-defining learning experiences.
            </Text>
          </Box>

          <Box className="space-y-3">
            {FEATURES.map((f) => (
              <Box key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <Text as="span" className="text-white/70 text-sm">{f}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom badge */}
        <Box className="relative z-10 flex items-center gap-3">
          <Box className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <Text as="span" className="text-white/60 text-xs">PMI Authorized Training Partner</Text>
          </Box>
          <Box className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <Text as="span" className="text-white/60 text-xs">ISO 9001:2015</Text>
          </Box>
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box className="flex flex-1 flex-col items-center justify-center p-8 bg-white">
        {/* Mobile logo */}
        <Box className="flex lg:hidden items-center gap-2 mb-8">
          <Box className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-deep flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </Box>
          <Text as="span" className="font-bold text-base">Invensis LMS</Text>
        </Box>

        <Box className="w-full max-w-sm">
          <Box className="mb-8">
            <Text as="h2" className="text-2xl font-bold text-foreground">Welcome back</Text>
            <Text as="p" className="text-muted-foreground text-sm mt-1">
              Sign in to continue your learning journey
            </Text>
          </Box>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Box className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
              {fieldErrors.email && (
                <Text as="p" className="text-xs text-destructive">{fieldErrors.email[0]}</Text>
              )}
            </Box>

            <Box className="space-y-1.5">
              <Box className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Text as="span" className="text-xs text-primary cursor-pointer hover:underline">
                  Forgot password?
                </Text>
              </Box>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
              {fieldErrors.password && (
                <Text as="p" className="text-xs text-destructive">{fieldErrors.password[0]}</Text>
              )}
            </Box>

            {error && !Object.keys(fieldErrors).length && (
              <Box className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <Text as="p" className="text-sm text-destructive">{error}</Text>
              </Box>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <Text as="p" className="mt-6 text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create one free
            </Link>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
