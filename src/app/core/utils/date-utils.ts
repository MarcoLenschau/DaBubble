export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} Uhr`;
}

export function isNewDay(current: number, previous?: number): boolean {
    if (!previous) return true;
    const currentDate = new Date(current).toDateString();
    const previousDate = new Date(previous).toDateString();
    return currentDate !== previousDate;
}

export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();

    const diffDays = getDayDifference(today, date);

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';

    const sameYear = date.getFullYear() === today.getFullYear();

    return formatDateWithWeekdayOrYear(date, sameYear);
}

function getDayDifference(today: Date, date: Date): number {
    const t = toDateOnly(today).getTime();
    const d = toDateOnly(date).getTime();
    const diff = t - d;
    return diff / (1000 * 60 * 60 * 24);
}

function toDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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

function formatDateSimple(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();

    const sameYear = date.getFullYear() === today.getFullYear();

    return date.toLocaleDateString('de-DE', sameYear
        ? { day: 'numeric', month: 'long' }
        : { month: 'long', year: 'numeric' });
}


function formatRelativeTime(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    return isToday ? formatTime(timestamp) : formatDate(timestamp);
}

export function formatRelativeTimeSimple(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    return isToday ? formatTime(timestamp) : formatDateSimple(timestamp);
}
