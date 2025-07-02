/**
 * Scrolls the given container element to the very bottom.
 * 
 * @param container - The HTML element to scroll.
 */
export function scrollToBottom(container: HTMLElement): void {
    container.scrollTop = container.scrollHeight;
}

/**
 * Checks if the user has scrolled near the bottom of the container.
 * 
 * @param container - The HTML element to check scroll position for.
 * @param threshold - The pixel distance from the bottom considered "at bottom" (default is 10).
 * @returns True if the user is within the threshold distance from the bottom.
 */
export function isUserScrolledToBottom(container: HTMLElement, threshold: number = 10): boolean {
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}
