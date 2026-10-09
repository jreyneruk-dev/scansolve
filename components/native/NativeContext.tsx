"use client";
import { createContext, useContext } from "react";

// Set once by the dashboard layout from the request user agent, so server and
// client render the same thing (no hydration flip) and nested components don't
// need the flag threaded through props.
const NativeContext = createContext(false);

export function NativeProvider({ native, children }: { native: boolean; children: React.ReactNode }) {
  return <NativeContext.Provider value={native}>{children}</NativeContext.Provider>;
}

export function useIsNative() {
  return useContext(NativeContext);
}
