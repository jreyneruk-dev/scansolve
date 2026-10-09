import type { CapacitorConfig } from "@capacitor/cli";

// The store apps are a native shell over the live staff dashboard. Web deploys
// update the app's screens; native changes (plugins, permissions, icons) need
// a new store build. See docs/NATIVE-APP.md.
const config: CapacitorConfig = {
  appId: "co.scansolve.app",
  appName: "ScanSolve",
  webDir: "mobile/www",
  server: {
    url: "https://scansolve.co/dashboard",
    // Shown when the first load fails (no signal). Mid-session loss shows NativeBridge's banner.
    errorPath: "offline.html",
  },
  // Server code keys off this to keep purchase prompts out of the apps (lib/native.ts).
  appendUserAgent: "ScanSolveApp/1",
  backgroundColor: "#f8fafc",
  ios: { path: "mobile/ios", contentInset: "automatic" },
  android: { path: "mobile/android" },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: "#f8fafc", showSpinner: false },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
};

export default config;
