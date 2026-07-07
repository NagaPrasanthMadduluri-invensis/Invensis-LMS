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

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email, password });
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
          <Text as="h1" className="text-2xl">Invensis LMS</Text>
        </CardTitle>
        <Text as="p" className="text-muted-foreground text-sm">
          Sign in to your account
        </Text>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Box className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {fieldErrors.email && (
              <Text as="p" className="text-xs text-red-600">{fieldErrors.email[0]}</Text>
            )}
          </Box>
          <Box className="space-y-2">
            <Box className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-indigo-500 font-medium hover:underline">
                Forgot password?
              </Link>
            </Box>
            <Box className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Box>
            {fieldErrors.password && (
              <Text as="p" className="text-xs text-red-600">{fieldErrors.password[0]}</Text>
            )}
          </Box>

          {error && !Object.keys(fieldErrors).length && (
            <Text as="p" className="text-sm text-red-600">{error}</Text>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Text as="p" className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-500 font-medium hover:underline">
              Register
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
