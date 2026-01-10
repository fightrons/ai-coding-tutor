/**
 * Timezone utilities for streak calculation and activity tracking.
 * Streaks are calculated based on the user's local timezone.
 */

/**
 * Detects the user's timezone using the browser's Intl API.
 * Returns a valid IANA timezone string (e.g., "America/New_York", "Europe/London").
 * Falls back to 'UTC' if detection fails.
 */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Gets the current date in the user's timezone as a YYYY-MM-DD string.
 * Used for streak calculations to determine if activity is on a new day.
 */
export function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(now) // Returns YYYY-MM-DD format
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Checks if a given date string is yesterday in the specified timezone.
 * Used for streak continuation logic.
 */
export function isYesterday(dateString: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone)
  const todayDate = new Date(today + 'T00:00:00Z')
  const checkDate = new Date(dateString + 'T00:00:00Z')

  const diffMs = todayDate.getTime() - checkDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays === 1
}

/**
 * Checks if a given date string is today in the specified timezone.
 * Used to prevent duplicate streak increments on same day.
 */
export function isToday(dateString: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone)
  return dateString === today
}
