"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

/**
 * Renders a formatted date only on the client side to avoid
 * server/client timezone hydration mismatches.
 */
export function ClientDate({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatDate(iso));
  }, [iso]);

  // Render nothing until client hydration is done — avoids mismatch
  if (!label) return null;
  return <>{label}</>;
}
