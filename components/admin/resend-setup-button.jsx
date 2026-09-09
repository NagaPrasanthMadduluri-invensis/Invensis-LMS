"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Check, Loader2, AlertCircle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";

/**
 * "Resend setup email" — shown against an account that is still Setup pending
 * (created, but the person never followed their password link).
 *
 * `onResend` is an async function that performs the call; this component owns
 * only the idle → sending → sent/failed feedback. The confirmation clears
 * itself after a few seconds so a row doesn't stay stuck on "Sent".
 */
export function ResendSetupButton({ onResend, label = "Resend setup email", className }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleClick(e) {
    // These buttons live inside clickable rows — don't navigate away.
    e.stopPropagation();
    e.preventDefault();
    if (state === "sending") return;

    setState("sending");
    setError(null);
    try {
      await onResend();
      setState("sent");
      timer.current = setTimeout(() => setState("idle"), 5000);
    } catch (err) {
      setError(err?.message || "Could not send the email.");
      setState("error");
      timer.current = setTimeout(() => setState("idle"), 8000);
    }
  }

  const cfg = {
    idle:    { icon: Mail,     text: label,     cls: "bg-amber-100 hover:bg-amber-200 text-amber-800" },
    sending: { icon: Loader2,  text: "Sending…", cls: "bg-amber-100 text-amber-800 cursor-wait" },
    sent:    { icon: Check,    text: "Email sent", cls: "bg-emerald-100 text-emerald-700" },
    error:   { icon: AlertCircle, text: "Retry",  cls: "bg-red-100 hover:bg-red-200 text-red-700" },
  }[state];
  const Icon = cfg.icon;

  return (
    <Box className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "sending"}
        title={state === "error" ? error : "Send the password-setup link again"}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 whitespace-nowrap",
          cfg.cls,
          className
        )}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", state === "sending" && "animate-spin")} />
        {cfg.text}
      </button>
      {state === "error" && error && (
        <Text as="span" className="text-[10px] text-red-600 max-w-[15rem] text-right leading-tight">{error}</Text>
      )}
    </Box>
  );
}
