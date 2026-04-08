/**
 * SSRF Protection — validates scraping target URLs.
 * Rejects private/loopback IPs and non-HTTPS schemes.
 */

const PRIVATE_RANGES = [
  /^127\./, // loopback
  /^10\./, // class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // class B private
  /^192\.168\./, // class C private
  /^0\./, // current network
  /^169\.254\./, // link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/, // IPv6 private
  /^fe80:/, // IPv6 link-local
];

export function validateScrapingURL(urlString: string): {
  valid: boolean;
  error?: string;
} {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  // Only allow HTTPS
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are allowed" };
  }

  // Check for IP-based hostnames
  const hostname = parsed.hostname;
  for (const pattern of PRIVATE_RANGES) {
    if (pattern.test(hostname)) {
      return { valid: false, error: "URL target is not allowed" };
    }
  }

  // Block localhost
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    return { valid: false, error: "URL target is not allowed" };
  }

  return { valid: true };
}
