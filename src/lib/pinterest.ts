/** Max stored Pinterest URL length (real board links are far shorter). */
export const PINTEREST_URL_MAX_LENGTH = 500;

const ALLOWED_HOSTS = new Set([
  "pinterest.com",
  "www.pinterest.com",
  "pin.it",
]);

export type PinterestValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function hasJunkCharacters(value: string) {
  return /[\s<>"']/.test(value) || value.toLowerCase().includes("javascript:");
}

/**
 * Validate a bride-pasted Pinterest URL (client + server).
 * Allows pinterest.com and pin.it only. Does not resolve short links.
 */
export function validatePinterestUrlInput(
  raw: string,
): PinterestValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Please paste a Pinterest link." };
  }
  if (trimmed.length > PINTEREST_URL_MAX_LENGTH) {
    return {
      ok: false,
      error: "That link is too long. Please paste a shorter Pinterest URL.",
    };
  }
  if (hasJunkCharacters(trimmed)) {
    return { ok: false, error: "Please paste a valid Pinterest link." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Please paste a valid Pinterest link." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Pinterest links must start with https://" };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      error: "Please use a pinterest.com or pin.it link.",
    };
  }

  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (host === "pin.it") {
    if (path === "/" || path.length < 3) {
      return { ok: false, error: "That pin.it link does not look complete." };
    }
    return { ok: true, url: `https://pin.it${path}` };
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 1) {
    return {
      ok: false,
      error: "Please paste a link to your Pinterest board.",
    };
  }

  return {
    ok: true,
    url: `https://www.pinterest.com/${segments.join("/")}/`,
  };
}

/**
 * Follow pin.it redirects to a canonical pinterest.com URL when possible.
 */
export async function resolvePinterestUrl(
  validatedUrl: string,
): Promise<PinterestValidationResult> {
  let host: string;
  try {
    host = new URL(validatedUrl).hostname.toLowerCase();
  } catch {
    return { ok: false, error: "Please paste a valid Pinterest link." };
  }

  if (host !== "pin.it") {
    return { ok: true, url: validatedUrl };
  }

  try {
    const res = await fetch(validatedUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "BridalClosetDressPrep/1.0",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    const finalUrl = res.url || validatedUrl;
    const check = validatePinterestUrlInput(finalUrl);
    if (
      check.ok &&
      new URL(check.url).hostname.replace(/^www\./, "") === "pinterest.com"
    ) {
      return check;
    }
    return { ok: true, url: validatedUrl };
  } catch {
    return { ok: true, url: validatedUrl };
  }
}

export async function normalizePinterestUrlForSave(
  raw: string,
): Promise<PinterestValidationResult> {
  const validated = validatePinterestUrlInput(raw);
  if (!validated.ok) return validated;
  return resolvePinterestUrl(validated.url);
}
