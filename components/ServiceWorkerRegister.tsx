"use client";

import { useEffect } from "react";

/** Registers the push service worker once on the client. No-op if unsupported. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal — alerts just won't be available.
    });
  }, []);
  return null;
}
