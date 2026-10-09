"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";

// Loaded on demand so its code never reaches the store apps or slows first paint.
const SupportWidget = dynamic(() => import("./SupportWidget").then((m) => m.SupportWidget), { ssr: false });

/**
 * The support chat quotes prices, so it stays out of the store apps (Apple 3.1.1).
 * Decided on the client so the root layout stays static.
 */
export function WebSupportWidget() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!isNativeApp()), []);
  return show ? <SupportWidget /> : null;
}
