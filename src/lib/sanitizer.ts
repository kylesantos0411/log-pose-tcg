/**
 * Input sanitization, validation, and XSS prevention utilities
 */

/**
 * Escape HTML special characters to prevent cross-site scripting (XSS)
 */
export function sanitizeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize plain text strings: removes control characters, null bytes, trims, and truncates
 */
export function sanitizeString(val: unknown, maxLength = 255): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Remove control characters (except newline and carriage return) and null bytes
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: unknown): string | null {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  // Standard RFC 5322 simplified email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
    return null;
  }
  return clean;
}

/**
 * Validate and sanitize card ID, preventing directory traversal / path injection
 * e.g. OP01-001, EB04-061_P2
 */
export function sanitizeIdentifier(id: unknown, maxLength = 64): string {
  if (!id || typeof id !== 'string') return '';
  // Only allow letters, numbers, hyphens, and underscores
  return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLength);
}

/**
 * Validate safe username (2 to 32 characters, letters, numbers, underscores, hyphens)
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim().replace(/^@/, '');
  return /^[a-zA-Z0-9_-]{2,32}$/.test(trimmed);
}

/**
 * Sanitize search query string for safe matching
 */
export function sanitizeSearchQuery(query: unknown, maxLength = 100): string {
  if (!query || typeof query !== 'string') return '';
  // Strip null bytes and dangerous control chars, limit length
  return query
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}
