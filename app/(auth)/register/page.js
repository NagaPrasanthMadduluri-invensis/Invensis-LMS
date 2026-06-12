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
import { GraduationCap, Sparkles } from "lucide-react";

function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form);
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
      <Box className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden" style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)" }}>
        <Box className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />

        <Box className="flex items-center gap-3 relative z-10">
          <Box className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-violet to-brand-deep flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </Box>
          <Text as="span" className="text-white font-bold text-lg tracking-tight">
            Invensis LMS
          </Text>
        </Box>

        <Box className="relative z-10 space-y-5">
          <Box className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand-gold" />
          </Box>
          <Text as="h1" className="text-3xl font-bold text-white leading-tight">
            Start your learning journey today
          </Text>
          <Text as="p" className="text-white/60 text-base leading-relaxed">
            Join thousands of professionals who have accelerated their careers with Invensis Learning.
          </Text>
          <Box className="flex gap-6 pt-2">
            {[["500+", "Courses"], ["50K+", "Learners"], ["95%", "Pass Rate"]].map(([num, label]) => (
              <Box key={label}>
                <Text as="p" className="text-2xl font-bold bg-gradient-to-r from-brand-gold to-brand-bronze bg-clip-text text-transparent">
                  {num}
                </Text>
                <Text as="p" className="text-white/50 text-xs mt-0.5">{label}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Text as="p" className="text-white/30 text-xs relative z-10">
          © 2025 Invensis Learning. All rights reserved.
        </Text>
      </Box>

      {/* ── Right form panel ── */}
      <Box className="flex flex-1 flex-col items-center justify-center p-8 bg-white overflow-y-auto">
        <Box className="flex lg:hidden items-center gap-2 mb-8">
          <Box className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-deep flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </Box>
          <Text as="span" className="font-bold text-base">Invensis LMS</Text>
        </Box>

        <Box className="w-full max-w-sm">
          <Box className="mb-7">
            <Text as="h2" className="text-2xl font-bold text-foreground">Create your account</Text>
            <Text as="p" className="text-muted-foreground text-sm mt-1">
              Free to join — start learning right away
            </Text>
          </Box>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Box className="grid grid-cols-2 gap-3">
              <Box className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={update("firstName")}
                  className="h-10"
                  required
                />
                {fieldErrors.first_name && (
                  <Text as="p" className="text-xs text-destructive">{fieldErrors.first_name[0]}</Text>
                )}
              </Box>
              <Box className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={update("lastName")}
                  className="h-10"
                  required
                />
                {fieldErrors.last_name && (
                  <Text as="p" className="text-xs text-destructive">{fieldErrors.last_name[0]}</Text>
                )}
              </Box>
            </Box>

            <Box className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                className="h-10"
                required
              />
              {fieldErrors.email && (
                <Text as="p" className="text-xs text-destructive">{fieldErrors.email[0]}</Text>
              )}
            </Box>

            <Box className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={update("password")}
                className="h-10"
                required
              />
              {fieldErrors.password && (
                <Text as="p" className="text-xs text-destructive">{fieldErrors.password[0]}</Text>
              )}
            </Box>

            <Box className="space-y-1.5">
              <Label htmlFor="passwordConfirmation" className="text-sm font-medium">Confirm password</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                placeholder="Repeat password"
                value={form.passwordConfirmation}
                onChange={update("passwordConfirmation")}
                className="h-10"
                required
              />
            </Box>

            {error && !Object.keys(fieldErrors).length && (
              <Box className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <Text as="p" className="text-sm text-destructive">{error}</Text>
              </Box>
            )}

            <Button type="submit" className="w-full h-11 font-semibold mt-1" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <Text as="p" className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}
