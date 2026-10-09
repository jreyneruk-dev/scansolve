// The store apps (Capacitor) append this token to the WebView user agent.
// Server code uses it to keep in-app purchase prompts out of the native apps
// (Apple 3.1.1); client code uses it to switch to native plugins.
const NATIVE_UA_TOKEN = "ScanSolveApp/";

/** Server: pass the request's user-agent (dynamic pages / route handlers only — never the root layout). */
export function isNativeUserAgent(ua: string | null | undefined): boolean {
  return !!ua && ua.includes(NATIVE_UA_TOKEN);
}

/** Client: true inside the iOS / Android app. */
export function isNativeApp(): boolean {
  return typeof navigator !== "undefined" && isNativeUserAgent(navigator.userAgent);
}
