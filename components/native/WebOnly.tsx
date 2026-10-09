"use client";
import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * Renders children only in a browser, never in the store apps. Decided on the
 * client so the root layout stays static (reading headers() there would make
 * every page dynamic).
 */
export function WebOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!isNativeApp()), []);
  return show ? <>{children}</> : null;
}
