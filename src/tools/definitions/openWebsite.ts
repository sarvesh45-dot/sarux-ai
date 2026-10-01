export interface OpenWebsiteParams {
  url: string;
}

export interface OpenWebsiteResult {
  success: boolean;
  opened?: boolean;
  cancelled?: boolean;
  url: string;
  domain?: string;
  error?: string;
}

const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'];
const DANGEROUS_CHARS = /[<>"'`|\\]/;

/**
 * Validates and sanitizes a URL to ensure it is safe to open.
 */
export function sanitizeAndValidateUrl(inputUrl: string): { valid: boolean; safeUrl?: string; domain?: string; error?: string } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  let cleaned = inputUrl.trim();

  // Check for dangerous characters
  if (DANGEROUS_CHARS.test(cleaned)) {
    return { valid: false, error: 'URL contains prohibited characters or potential script injection.' };
  }

  const lower = cleaned.toLowerCase();

  // Reject blocked schemes
  for (const scheme of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(scheme)) {
      return { valid: false, error: `Protocol "${scheme}" is strictly forbidden for security reasons.` };
    }
  }

  // Auto-prepend https:// if no protocol is given
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: `Only HTTP and HTTPS web URLs are permitted (received ${parsed.protocol}).` };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'URL must contain a valid domain name (e.g. youtube.com, github.com).' };
    }

    return {
      valid: true,
      safeUrl: parsed.href,
      domain: parsed.hostname,
    };
  } catch (err: unknown) {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

/**
 * Executes open_website tool in browser context.
 */
export function openWebsite(params: OpenWebsiteParams): OpenWebsiteResult {
  const validation = sanitizeAndValidateUrl(params?.url);

  if (!validation.valid || !validation.safeUrl) {
    return {
      success: false,
      url: params?.url || '',
      error: validation.error || 'Invalid URL.',
    };
  }

  // If in browser environment
  if (typeof window !== 'undefined') {
    try {
      const win = window.open(validation.safeUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        return {
          success: false,
          url: validation.safeUrl,
          domain: validation.domain,
          error: 'Browser popup was blocked. Please allow popups or open the link manually.',
        };
      }

      return {
        success: true,
        opened: true,
        url: validation.safeUrl,
        domain: validation.domain,
      };
    } catch (e: unknown) {
      return {
        success: false,
        url: validation.safeUrl,
        domain: validation.domain,
        error: 'Unable to open website due to browser restriction.',
      };
    }
  }

  return {
    success: true,
    opened: true,
    url: validation.safeUrl,
    domain: validation.domain,
  };
}
