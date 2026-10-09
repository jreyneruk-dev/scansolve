"use client";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner, BarcodeFormat } from "@capacitor-mlkit/barcode-scanning";
import { parseLabelUrl } from "@/lib/label-url";

/**
 * Opens the native QR scanner and returns the in-app path for the label, or
 * null if the user cancelled. Throws a readable error for foreign QR codes.
 */
export async function scanLabel(): Promise<string | null> {
  if (Capacitor.getPlatform() === "android") {
    // Google's code scanner is a Play services module that may not be downloaded yet.
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      throw new Error("The scanner is being set up on this phone. Try again in a few seconds.");
    }
  }
  if (Capacitor.getPlatform() === "ios") {
    // Android's Google code scanner needs no camera permission; iOS does.
    const perm = await BarcodeScanner.requestPermissions();
    if (perm.camera !== "granted" && perm.camera !== "limited") {
      throw new Error("ScanSolve needs the camera to scan labels. Turn it on in Settings › ScanSolve.");
    }
  }
  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  const raw = barcodes[0]?.rawValue;
  if (!raw) return null;
  const label = parseLabelUrl(raw, window.location.host);
  if (!label) throw new Error("That isn't a ScanSolve label.");
  return `/commission/${label.orgNumber}/${label.uid}`;
}
