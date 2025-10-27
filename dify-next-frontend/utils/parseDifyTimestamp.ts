// Robust date parser for Dify API (chat-messages, chatflow, etc.)
// Handles: epoch seconds, epoch ms, ISO string, fallback
export function parseDifyTimestamp(raw: number | string | undefined | null): Date {
  if (raw === undefined || raw === null) return new Date();
  // If number: epoch seconds or ms
  if (typeof raw === 'number') {
    if (raw > 1000000000000) return new Date(raw); // ms
    if (raw > 1000000000) return new Date(raw * 1000); // s
  }
  // If string: try number first
  if (typeof raw === 'string') {
    const num = Number(raw);
    if (!isNaN(num)) {
      if (num > 1000000000000) return new Date(num); // ms
      if (num > 1000000000) return new Date(num * 1000); // s
    }
    // Try ISO string
    const iso = Date.parse(raw);
    if (!isNaN(iso)) return new Date(raw);
  }
  // Fallback: now
  return new Date();
}
