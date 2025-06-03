function formatTime(timestamp: number): string {
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

    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Heute';

    const sameYear = date.getFullYear() === today.getFullYear();

    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(sameYear ? {} : { year: 'numeric' }),
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
