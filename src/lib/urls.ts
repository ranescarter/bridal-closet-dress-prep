export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
