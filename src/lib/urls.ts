const DEFAULT_ADMIN_HOST = "https://admin.mybridalcloset.com";
const DEFAULT_BRIDE_HOST = "https://bride.mybridalcloset.com";
const DEFAULT_GUEST_HOST = "https://guest.mybridalcloset.com";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function withFallback(value: string | undefined, fallback: string) {
  return trimTrailingSlash(value?.trim() || fallback);
}

function isLocalBrowserHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * Session links use dedicated bride/guest hosts in production.
 * On localhost they stay on the current origin so Copy/Open match the local app.
 */
function linkOrigin(configuredOrigin: string) {
  if (isLocalBrowserHost()) return window.location.origin;
  return configuredOrigin;
}

/** Staff dashboard / tools host */
export function adminOrigin() {
  return withFallback(process.env.NEXT_PUBLIC_ADMIN_ORIGIN, DEFAULT_ADMIN_HOST);
}

/** Bride editable session host */
export function brideOrigin() {
  return withFallback(process.env.NEXT_PUBLIC_BRIDE_ORIGIN, DEFAULT_BRIDE_HOST);
}

/** Guest / F&F read-only session host */
export function guestOrigin() {
  return withFallback(process.env.NEXT_PUBLIC_GUEST_ORIGIN, DEFAULT_GUEST_HOST);
}

/** Same-origin absolute URL (current browser host). */
export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return normalized;
  return `${window.location.origin}${normalized}`;
}

export function brideSessionUrl(clientToken: string) {
  return `${linkOrigin(brideOrigin())}/s/${clientToken}`;
}

export function guestSessionUrl(staffToken: string) {
  return `${linkOrigin(guestOrigin())}/s/${staffToken}`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
