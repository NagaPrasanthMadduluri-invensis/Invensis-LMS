"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { setPassword } from "@/services/api/auth/auth-api";

const COPY = {
  reset: {
    title: "Reset your password",
    subtitle: "Choose a new password for your account.",
    cta: "Reset password",
    busy: "Resetting...",
  },
  setup: {
    title: "Set up your account",
    subtitle: "Create a password to activate your account and sign in.",
    cta: "Set password",
    busy: "Setting up...",
  },
};

/**
 * Shared form for both flows — the backend's /auth/set-password serves the
 * account-setup and password-reset email links alike (API.md §2.6).
 * `mode` only changes the wording.
 */
export function SetPasswordForm({ mode = "reset" }) {
  const copy = COPY[mode] || COPY.reset;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // No token in the URL → the link is malformed.
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center py-10 px-6">
          <Box className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </Box>
          <Text as="h1" className="mt-4 text-xl font-semibold">Invalid link</Text>
          <Text as="p" className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            This link is missing its token. Please use the most recent link from your email,
            or request a new one.
          </Text>
          <Box className="mt-6 flex gap-2">
            <Button asChild variant="outline">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (password.length < 8) {
      setFieldErrors({ password: ["Password must be at least 8 characters."] });
      return;
    }
    if (password !== confirm) {
      setFieldErrors({ confirm: ["Passwords don't match."] });
      return;
    }

    setLoading(true);
    try {
      await setPassword({ token, password });
      setDone(true);
    } catch (err) {
      if (err.errors) setFieldErrors(err.errors);
      // 400 = invalid/expired/used token; anything else falls back to its message.
      setError(err.message || "Couldn't set your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center py-10 px-6">
          <Box className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </Box>
          <Text as="h1" className="mt-4 text-xl font-semibold">You&apos;re all set</Text>
          <Text as="p" className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            Password set. You can now log in with your new password.
          </Text>
          <Button
            asChild
            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>
          <Text as="h1" className="text-2xl">{copy.title}</Text>
        </CardTitle>
        <Text as="p" className="text-muted-foreground text-sm">{copy.subtitle}</Text>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Box className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPwd(e.target.value)}
              required
            />
            {fieldErrors.password && (
              <Text as="p" className="text-xs text-red-600">{fieldErrors.password[0]}</Text>
            )}
          </Box>
          <Box className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {fieldErrors.confirm && (
              <Text as="p" className="text-xs text-red-600">{fieldErrors.confirm[0]}</Text>
            )}
          </Box>

          {error && !Object.keys(fieldErrors).length && (
            <Box className="rounded-lg bg-red-50 px-3 py-2">
              <Text as="p" className="text-sm text-red-600">{error}</Text>
              {/expired|invalid|used/i.test(error) && (
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Request a new link →
                </Link>
              )}
            </Box>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            disabled={loading}
          >
            {loading ? copy.busy : copy.cta}
          </Button>

          <Text as="p" className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="text-indigo-500 font-medium hover:underline">
              Back to sign in
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}
