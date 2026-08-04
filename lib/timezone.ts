/**
 * Returns the current time in Bangladesh Standard Time (UTC+6).
 * Use this instead of `new Date()` for any business logic that needs
 * the "current" date/time from a Bangladesh user's perspective.
 * 
 * Vercel servers run in UTC, so `new Date()` would return UTC time.
 * This helper adds 6 hours to give Bangladesh time.
 */
export function getBDNow(): Date {
  const utc = new Date()
  return new Date(utc.getTime() + 6 * 60 * 60 * 1000)
}

/**
 * Returns today's date string (YYYY-MM-DD) in Bangladesh time.
 * Useful for defaulting date inputs.
 */
export function getBDTodayStr(): string {
  return getBDNow().toISOString().split("T")[0]
}
