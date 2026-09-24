"use client";

import { RouteError } from "@/components/shared/route-error";

export default function AdminSegmentError({ error, reset }) {
  return <RouteError error={error} reset={reset} what="this page" />;
}
