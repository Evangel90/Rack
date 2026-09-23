/**
 * The memo is `(optional (buff 34))`. A UUID quote id is 36 chars as text, so we send its
 * 16 raw bytes instead. Shared by the client (building the call) and the API (verifying it).
 */
export function quoteMemoHex(quoteId: string) {
  const hex = quoteId.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error("Quote id must be a UUID");
  return hex;
}
