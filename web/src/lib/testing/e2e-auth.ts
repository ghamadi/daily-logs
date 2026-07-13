/**
 * Test-only authentication bypass for the Playwright E2E harness.
 *
 * The harness runs no real Google OAuth or Supabase. Instead an authenticated
 * session is injected as a cookie holding a `{ sub, email }` payload; when the
 * bypass is enabled the proxy gate and the principal resolver trust it instead
 * of verifying a Supabase JWT. Only JWT verification is skipped — the cookie is
 * resolved to a user through the same production path, so tests hit real code.
 *
 * Why an unsigned, forgeable cookie is safe: it is trusted only when
 * `isE2eAuthBypassEnabled()` holds, and that flag is server-only (never
 * `NEXT_PUBLIC_*`, so it can't reach a client bundle) and set in exactly one
 * place — the Playwright webServer, bound to the throwaway test database.
 *
 * This module is imported by the Edge proxy, so it must stay Edge-safe: no
 * `node:` imports (see the codec below).
 */

export const E2E_SESSION_COOKIE_NAME = 'dl-e2e-session';

export type E2eSession = {
  sub: string;
  email: string;
};

/**
 * The bypass is active only when explicitly enabled AND outside production.
 * Server-only flag — never expose as `NEXT_PUBLIC_*`.
 */
export function isE2eAuthBypassEnabled(): boolean {
  return process.env.E2E_AUTH_BYPASS === '1' && process.env.NODE_ENV !== 'production';
}

/**
 * Encode a test session into the cookie value: base64url of the JSON payload.
 * Edge-safe (uses `btoa`, no `Buffer`).
 */
export function encodeE2eSessionCookieValue(session: E2eSession): string {
  const json = JSON.stringify({ sub: session.sub, email: session.email });
  return base64UrlEncode(json);
}

/**
 * Parse the cookie value back into a session, or `null` on any malformed input
 * (bad base64, invalid JSON, missing fields) — so callers treat a parse failure
 * as "unauthenticated". Asserts the bypass is enabled first, so it fails loud if
 * ever reached outside the E2E environment rather than trusting a stray cookie.
 */
export function parseE2eSessionCookieValue(value: string | undefined | null): E2eSession | null {
  if (!isE2eAuthBypassEnabled()) {
    throw new Error('E2E authentication bypass is not enabled.');
  }

  if (!value) {
    return null;
  }

  try {
    const json = base64UrlDecode(value);
    const parsed = JSON.parse(json);

    if (
      parsed &&
      parsed.sub &&
      parsed.email &&
      typeof parsed.sub === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return { sub: parsed.sub, email: parsed.email };
    }

    return null;
  } catch {
    return null;
  }
}

// ========================================================
// INTERNAL HELPERS
// ========================================================

function base64UrlEncode(input: string): string {
  // btoa/atob work on Latin-1, so bridge through raw UTF-8 bytes with the
  // Web-standard TextEncoder/TextDecoder (available in both Edge and Node).
  const bytes = new TextEncoder().encode(input);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
