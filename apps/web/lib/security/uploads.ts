/**
 * File upload validation — client-side checks before upload.
 */

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, or WebP under 5MB",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
    };
  }

  return { valid: true };
}
