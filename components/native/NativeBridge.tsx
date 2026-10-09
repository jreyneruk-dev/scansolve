"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

/**
 * Native-only wiring for the store apps: status bar, splash, Android back
 * button, opening the issue a push notification was about, and an offline
 * banner (server.errorPath only covers the first load). Rendered only when
 * the dashboard layout detects the app.
 */
export function NativeBridge() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    (async () => {
      const [{ App }, { StatusBar, Style }, { SplashScreen }, { PushNotifications }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/push-notifications"),
      ]);
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      SplashScreen.hide().catch(() => {});

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && window.location.pathname !== "/dashboard") window.history.back();
        else App.minimizeApp();
      });
      // Only follow in-app dashboard paths from a notification payload.
      const tap = await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const path = String(notification.data?.path ?? "");
        if (/^\/dashboard(\/issues\/[0-9a-f-]{36})?$/.test(path)) router.push(path);
      });
      cleanups.push(() => back.remove(), () => tap.remove());
    })().catch(() => {});

    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      cleanups.forEach((c) => c());
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [router]);

  if (!offline) return null;
  return (
    <div role="status" className="sticky top-14 z-20 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-800">
      <WifiOff className="h-3.5 w-3.5" /> You&apos;re offline. Changes will fail until you reconnect.
    </div>
  );
}
