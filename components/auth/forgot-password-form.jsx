"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck, ArrowLeft } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { forgotPassword } from "@/services/api/auth/auth-api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      setMessage(res?.message || "If an account exists for that email, a reset link has been sent.");
      setSent(true);
    } catch (err) {
      // The endpoint is designed not to error on unknown emails; surface anything else.
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center py-10 px-6">
          <Box className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <MailCheck className="h-7 w-7 text-emerald-600" />
          </Box>
          <Text as="h1" className="mt-4 text-xl font-semibold">Check your inbox</Text>
          <Text as="p" className="mt-1.5 text-sm text-muted-foreground max-w-sm">{message}</Text>
          <Text as="p" className="mt-2 text-xs text-muted-foreground">
            The link is valid for 72 hours. Don&apos;t forget to check spam.
          </Text>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/login"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>
          <Text as="h1" className="text-2xl">Forgot your password?</Text>
        </CardTitle>
        <Text as="p" className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
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
          </Box>

          {error && <Text as="p" className="text-sm text-red-600">{error}</Text>}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <Text as="p" className="text-sm text-center text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-violet-500 font-medium hover:underline">
              Back to sign in
            </Link>
          </Text>
        </form>
      </CardContent>
    </Card>
  );
}
