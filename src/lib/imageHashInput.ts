/**
 * Normalize user input: bare 0x… hash, 64-char hex without 0x, or indexer URL (?root=…).
 */
export function normalizeImageHashInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  if (t.includes("root=") || /^https?:\/\//i.test(t) || t.includes("/file")) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/\//u, "")}`;
      const u = new URL(normalizedUrl);
      const root = u.searchParams.get("root");
      if (root) return hexLower(root);
    } catch {
      // fall through
    }
    const m = t.match(/0x[a-fA-F0-9]{64}/i);
    if (m) return m[0].toLowerCase();
  }

  return hexLower(t);
}

function hexLower(s: string): string {
  let h = s.trim();
  if (/^[a-fA-F0-9]{64}$/i.test(h)) return `0x${h.toLowerCase()}`;
  if (/^0x[a-fA-F0-9]{64}$/i.test(h)) return h.toLowerCase();
  return h.toLowerCase();
}
