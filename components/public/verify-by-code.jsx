"use client";

/*
 * Result-only verification, for a scanned QR.
 *
 * The code is already in the URL, so asking for it again is asking the holder
 * to retype what they just scanned. This resolves on arrival and shows nothing
 * but the outcome; the search form stays at /verify for people typing an ID by
 * hand.
 */

import { useEffect, useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { VerifiedCertificate, VerifyNotFound } from "@/components/public/verify-result";

const API = process.env.NEXT_PUBLIC_API_URL;

export function VerifyByCode({ code }) {
  const [state, setState] = useState({ loading: true, result: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const q = String(code ?? "").trim();
    if (!q) {
      setState({ loading: false, result: { found: false, query: "" }, error: null });
      return;
    }
    fetch(`${API}/verify/${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setState({ loading: false, result: d, error: null }); })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, result: null, error: "Verification is unavailable right now. Please try again shortly." });
        }
      });
    return () => { cancelled = true; };
  }, [code]);

  return (
    <Box className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Box className="mb-6 flex items-center justify-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#0b2e5c]" />
        <Text as="p" className="text-sm font-semibold text-[#0b2e5c]">Invensis Learning · Certificate Verification</Text>
      </Box>

      {state.loading && (
        <Box className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1553a3]" />
          <Text as="p" className="mt-3 text-sm text-slate-600">
            Verifying <Text as="span" className="font-mono font-semibold text-slate-800">{code}</Text>…
          </Text>
        </Box>
      )}

      {!state.loading && state.error && (
        <Box className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <Text as="p" className="text-sm text-amber-800">{state.error}</Text>
        </Box>
      )}

      {!state.loading && state.result && (
        state.result.found
          ? <VerifiedCertificate certificate={state.result.certificate} />
          : <VerifyNotFound query={state.result.query || code} />
      )}

      {/* Escape hatch for someone who scanned the wrong certificate. */}
      <Box className="mt-6 text-center">
        <Text
          as="a"
          href="/verify"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1553a3] hover:underline"
        >
          <Search className="h-3.5 w-3.5" /> Verify a different certificate
        </Text>
      </Box>
    </Box>
  );
}
