"use client";

import { useEffect, useState } from "react";
import { Ticket, X } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyVoucherBookings } from "@/services/api/learner/learner-api";
import { formatDate } from "@/lib/datetime";

// Per-viewer record of which voucher notifications have been dismissed, so a
// booking is announced once and stays gone after the learner closes it. Browser
// storage only — a convenience, never the source of truth (that's the DB).
const DISMISS_KEY = "lms_voucher_notice_dismissed";

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(set) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore — storage unavailable (private window etc.) */
  }
}

/**
 * In-portal notification that a learner's exam voucher has been booked. Shows a
 * dismissible banner per booked voucher (with its validity/expiry), reading the
 * learner's own voucher bookings. Renders nothing when there's nothing to show.
 */
export function VoucherBanner() {
  const { token } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchMyVoucherBookings({ token })
      .then((res) => { if (active) setVouchers(res?.vouchers || []); })
      .catch(() => { if (active) setVouchers([]); });
    return () => { active = false; };
  }, [token]);

  function dismiss(id) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  }

  const visible = vouchers.filter((v) => !dismissed.has(v.id));
  if (visible.length === 0) return null;

  return (
    <Box className="space-y-2">
      {visible.map((v) => (
        <Box
          key={v.id}
          className="flex items-start gap-3 rounded-2xl bg-success-subtle ring-1 ring-success-border px-4 py-3"
        >
          <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-subtle">
            <Ticket className="h-4 w-4 text-success" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Text as="p" className="text-sm font-semibold text-success-subtle-foreground leading-tight">
              Your exam voucher for {v.course_name} is booked
            </Text>
            <Text as="p" className="text-xs text-success-subtle-foreground mt-0.5">
              {v.expires_at
                ? `Valid until ${formatDate(v.expires_at)} — redeem it and sit your exam before then.`
                : "Redeem it and sit your exam before it expires."}
            </Text>
          </Box>
          <button
            type="button"
            onClick={() => dismiss(v.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-lg p-1 text-success-subtle-foreground/70 hover:bg-success-subtle hover:text-success-subtle-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </Box>
      ))}
    </Box>
  );
}
