/**
 * Parses a scanned ScanSolve label. Only our own https host and the exact
 * /scan/{org_number}/{uid} shape are accepted — a QR code is untrusted input.
 */
export function parseLabelUrl(raw: string, appHost: string): { orgNumber: string; uid: string } | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.host !== appHost || url.username || url.password) return null;
  const m = /^\/scan\/(\d{1,9})\/(\d{1,30})\/?$/.exec(url.pathname);
  return m ? { orgNumber: m[1], uid: m[2] } : null;
}
