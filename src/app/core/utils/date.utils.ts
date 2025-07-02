/**
 * Formats a timestamp into a "HH:MM Uhr" time string.
 * 
 * @param timestamp The Unix timestamp to format.
 * @returns Formatted time string.
 */
export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} Uhr`;
}

/**
 * Checks if the current timestamp is on a different day than the previous.
 * 
 * @param current Current timestamp.
 * @param previous Previous timestamp.
 * @returns True if it's a new day.
 */
export function isNewDay(current: number, previous?: number): boolean {
    if (!previous) return true;
    const currentDate = new Date(current).toDateString();
    const previousDate = new Date(previous).toDateString();
    return currentDate !== previousDate;
}

/**
 * Formats a timestamp into a relative date string: "Heute", "Gestern", or full date.
 * 
 * @param timestamp The Unix timestamp to format.
 * @returns Formatted date string.
 */
export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();

    const diffDays = getDayDifference(today, date);

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';

    const sameYear = date.getFullYear() === today.getFullYear();

    return formatDateWithWeekdayOrYear(date, sameYear);
}

/**
 * Calculates the day difference between two dates (ignoring time).
 *
 * @param today - The current date.
 * @param date - The date to compare.
 * @returns Number of full days between dates.
 */
function getDayDifference(today: Date, date: Date): number {
    const t = toDateOnly(today).getTime();
    const d = toDateOnly(date).getTime();
    const diff = t - d;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns a date object with time set to 00:00:00.
 *
 * @param date - The input date.
 * @returns The date at midnight.
 */
function toDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Formats a date with weekday if it's from the same year, otherwise adds the year.
 *
 * @param date - The date to format.
 * @param isSameYear - Whether the year is the same as today.
 * @returns A localized date string.
 */
function formatDateWithWeekdayOrYear(date: Date, isSameYear: boolean): string {
    return date.toLocaleDateString('de-DE', {
        ...(isSameYear ? {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }
            : {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
    });
}

/**
 * Formats a date into a simplified string without weekday.
 *
 * @param timestamp - The timestamp to format.
 * @returns Simplified formatted date string.
 */
function formatDateSimple(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();

    const sameYear = date.getFullYear() === today.getFullYear();

    return date.toLocaleDateString('de-DE', sameYear
        ? { day: 'numeric', month: 'long' }
        : { month: 'long', year: 'numeric' });
}

/**
 * Returns either the time or full formatted date based on whether it's today.
 *
 * @param timestamp - The timestamp to format.
 * @returns Time if today, otherwise full date.
 */
function formatRelativeTime(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    return isToday ? formatTime(timestamp) : formatDate(timestamp);
}

/**
 * Returns a simplified relative time string.
 *
 * @param timestamp - The timestamp to format.
 * @returns Time if today, otherwise simple date.
 */
export function formatRelativeTimeSimple(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    return isToday ? formatTime(timestamp) : formatDateSimple(timestamp);
}

/**
 * Formats the relative day as lowercase string without time.
 *
 * @param timestamp - The timestamp or Date object.
 * @returns Relative formatted string like "heute", "gestern", or "am 5. Juni".
 */
export function formatRelativeDayLowercaseNoTime(
    timestamp: number | Date): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffDays = getDayDifference(now, date);
    if (diffDays === 0) {
        return 'heute';
    }
    if (diffDays === 1) {
        return 'gestern';
    }

    return formatFullDateRelative(date, now);
}

/**
 * Formats full date with "am" prefix, localized to German.
 *
 * @param date - The date to format.
 * @param now - The current date.
 * @returns Formatted string like "am 1. Januar 2024".
 */
function formatFullDateRelative(date: Date, now: Date): string {
    const sameYear = date.getFullYear() === now.getFullYear();
    const options: Intl.DateTimeFormatOptions = sameYear
        ? { day: 'numeric', month: 'long' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
    const datePart = date.toLocaleDateString('de-DE', options);
    return `am ${datePart}`;
}