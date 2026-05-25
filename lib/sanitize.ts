/**
 * Shared sanitization utilities.
 * Use these on any user-supplied string before storing, emailing, or rendering.
 */

/**
 * Escape HTML special characters to prevent XSS in email templates
 * and any server-rendered HTML strings.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strip all HTML/XML tags from a string.
 * Used for category names and other fields displayed in UI.
 */
export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate that a string is a safe UUID (v4 format).
 * Prevents path traversal when using IDs in storage paths.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validate that a string is a safe alphanumeric UID (label format).
 * Label UIDs are purely numeric, e.g. "10260000001".
 */
export function isSafeUID(str: string): boolean {
  return /^\d{1,20}$/.test(str);
}

/**
 * Sanitize a category string: strip tags, normalize whitespace, limit length.
 */
export function sanitizeCategory(str: string): string {
  return stripTags(str).replace(/\s+/g, " ").trim().slice(0, 50);
}

/**
 * Image MIME type → expected magic bytes map.
 * Used for server-side file signature verification.
 */
const MAGIC: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/webp": [
    // RIFF....WEBP — check bytes 0-3 and 8-11
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  ],
  // HEIC is ISOBMFF; magic varies by encoder — we accept on MIME only (already restricted upstream)
  "image/heic": [],
  "image/heif": [],
};

/** Safe extension map — never derive extension from the uploaded filename */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const ALLOWED_IMAGE_TYPES = Object.keys(MIME_TO_EXT);

/**
 * Verify file magic bytes match the declared MIME type.
 * Returns true if valid or if the type has no magic check (HEIC/HEIF).
 */
export function verifyMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  const checks = MAGIC[mimeType];
  if (!checks || checks.length === 0) return true; // No check for this type

  for (const check of checks) {
    const offset = check.offset ?? 0;
    for (let i = 0; i < check.bytes.length; i++) {
      if (buffer[offset + i] !== check.bytes[i]) return false;
    }
  }
  return true;
}

/**
 * Get the safe file extension for a MIME type.
 */
export function safeExtFromMime(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? "bin";
}
