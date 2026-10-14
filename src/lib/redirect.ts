/**
 * Returns a safe in-app path for post-login redirects. Only same-origin absolute paths
 * are allowed ("/checkout"); protocol-relative or external URLs fall back to "/".
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (raw.startsWith('/login') || raw.startsWith('/register')) return fallback;
  return raw;
}
