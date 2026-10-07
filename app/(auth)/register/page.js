"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/providers/auth-provider";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>
          <Text as="h1" className="text-2xl">Create Account</Text>
        </CardTitle>
        <Text as="p" className="text-muted-foreground text-sm">
          Register for Invensis Learning Portal
        </Text>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Box className="grid grid-cols-2 gap-3">
            <Box className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={update("firstName")}
                required
              />
              {fieldErrors.first_name && (
                <Text as="p" className="text-xs text-error">{fieldErrors.first_name[0]}</Text>
              )}
            </Box>
            <Box className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={update("lastName")}
                required
              />
              {fieldErrors.last_name && (
                <Text as="p" className="text-xs text-error">{fieldErrors.last_name[0]}</Text>
              )}
            </Box>
          </Box>

          <Box className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
              required
            />
            {fieldErrors.email && (
              <Text as="p" className="text-xs text-error">{fieldErrors.email[0]}</Text>
            )}
          </Box>

          <Box className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Box className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={form.password}
                onChange={update("password")}
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Box>
            {fieldErrors.password && (
              <Text as="p" className="text-xs text-error">{fieldErrors.password[0]}</Text>
            )}
          </Box>

          <Box className="space-y-2">
            <Label htmlFor="passwordConfirmation">Confirm Password</Label>
            <Box className="relative">
              <Input
                id="passwordConfirmation"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={form.passwordConfirmation}
                onChange={update("passwordConfirmation")}
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Box>
          </Box>

          {error && !Object.keys(fieldErrors).length && (
            <Text as="p" className="text-sm text-error">{error}</Text>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0466c8] to-[#023e7d] hover:from-[#0582ca] hover:to-[#001233] text-white"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </Button>

          <Text as="p" className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}
