/** UUID v4 in secure contexts and LAN HTTP, without Math.random(). */
export function createUuid(): string {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""), hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""), hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

let lastFallbackReference = 0;

/** A display reference, never an authentication token or security identifier. */
export function createBuildId(): string {
  try {
    const bytes = new Uint8Array(4);
    globalThis.crypto.getRandomValues(bytes);
    return `PC-${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  } catch {
    // Optional references must not prevent startup if crypto is unavailable.
    // This fallback is deliberately not offered as a UUID or random token.
    lastFallbackReference = Math.max(Date.now(), lastFallbackReference + 1);
    return `PC-${lastFallbackReference.toString(16).slice(-8).padStart(8, "0").toUpperCase()}`;
  }
}
