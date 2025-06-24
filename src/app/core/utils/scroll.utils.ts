export function scrollToBottom(container: HTMLElement): void {
    container.scrollTop = container.scrollHeight;
}

export function isUserScrolledToBottom(container: HTMLElement, threshold: number = 10): boolean {
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}
