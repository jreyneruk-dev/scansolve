"use client";
// Store-app push (Capacitor). Only call these inside the native app.
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const TOKEN_KEY = "scansolve.nativePushToken";

function savedToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** Asks permission, gets the FCM token and registers it with our server. */
export async function registerNativePush(): Promise<void> {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") {
    throw new Error("Notifications are turned off for ScanSolve. Turn them on in your phone's Settings.");
  }
  const token = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Couldn't reach the notification service. Try again.")), 15000);
    PushNotifications.addListener("registration", (t) => { clearTimeout(timer); resolve(t.value); });
    PushNotifications.addListener("registrationError", (e) => { clearTimeout(timer); reject(new Error(e.error)); });
    PushNotifications.register();
  });
  await PushNotifications.removeAllListeners();

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "native", token, platform: Capacitor.getPlatform() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Could not turn on alerts");
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function nativePushRegistered(): boolean {
  return Capacitor.isNativePlatform() && !!savedToken();
}

/**
 * Stops alerts to this phone. Called on "turn off", sign-out and account
 * deletion, so a handed-down phone never receives another org's issues.
 * `server: false` skips the API call when the account is already gone.
 */
export async function unregisterNativePush({ server = true } = {}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const token = savedToken();
  if (token && server) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  await PushNotifications.unregister().catch(() => {});
}
