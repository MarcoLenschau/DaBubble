import { Emoji } from '../interfaces/emojis.interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { ViewMode } from '../enums/view-mode.enum';

/**
 * Finds an emoji object by its name.
 * 
 * @param emojis - List of emojis to search through.
 * @param name - The name of the emoji to find.
 * @returns The matching emoji object or undefined if not found.
 */
export function getEmojiByName(
    emojis: Emoji[],
    name: string
): Emoji | undefined {
    return emojis.find((e) => e.name === name);
}

/**
 * Finds an emoji object by its unicode value.
 * 
 * @param emojis - List of emojis to search through.
 * @param unicode - The unicode value of the emoji.
 * @returns The matching emoji object or undefined if not found.
 */
export function getEmojiByUnicode(
    emojis: Emoji[],
    unicode: string
): Emoji | undefined {
    return emojis.find((e) => e.unicode === unicode);
}

/**
 * Appends a unicode emoji to the current textarea content.
 * 
 * @param textareaContent - The existing text in the textarea.
 * @param unicodeEmoji - The unicode string of the emoji to append.
 * @returns The updated textarea content with the emoji appended.
 */
export function addEmojiToTextarea(
    textareaContent: string,
    unicodeEmoji: string
): string {
    return textareaContent + unicodeEmoji;
}

/**
 * Adds or toggles a reaction (emoji) for a message by a specific user.
 * 
 * @param emojiName - The name of the emoji to toggle.
 * @param message - The message object to update.
 * @param userId - The ID of the user reacting.
 * @returns A new message object with updated reactions.
 */
export function addEmojiToMessage(emojiName: string, message: Message, userId: string): Message {
    const existingReaction = message.reactions.find((r) => r.emojiName === emojiName);
    let newReactions: Reaction[];
    if (!existingReaction) {
        newReactions = addNewReaction(message.reactions, emojiName, userId);
    } else if (existingReaction.userIds.includes(userId)) {
        newReactions = removeUserFromReaction(message.reactions, existingReaction, userId);
    } else {
        newReactions = addUserToReaction(message.reactions, existingReaction, userId);
    }
    return { ...message, reactions: newReactions };
}

/**
 * Removes a user from a specific reaction.
 * If the reaction becomes empty, it's removed from the list.
 * 
 * @param reactions - The full list of reactions.
 * @param target - The target reaction to update.
 * @param userId - The ID of the user to remove.
 * @returns Updated reactions list.
 */
function removeUserFromReaction(
    reactions: Reaction[],
    target: Reaction,
    userId: string
): Reaction[] {
    const updatedUserIds = target.userIds.filter(id => id !== userId);
    if (updatedUserIds.length === 0) {
        return reactions.filter(r => r !== target);
    }
    return reactions.map(r =>
        r === target ? { ...r, userIds: updatedUserIds } : r
    );
}

/**
 * Adds a user to an existing reaction.
 * 
 * @returns Updated reactions list.
 */
function addUserToReaction(
    reactions: Reaction[],
    target: Reaction,
    userId: string
): Reaction[] {
    return reactions.map(r =>
        r === target ? { ...r, userIds: [...r.userIds, userId] } : r
    );
}

/**
 * Adds a new reaction to the list.
 * 
 * @param reactions - The existing list of reactions.
 * @param emojiName - The name of the emoji to add.
 * @param userId - The ID of the user reacting.
 * @returns New reactions list including the added reaction.
 */
function addNewReaction(
    reactions: Reaction[],
    emojiName: string,
    userId: string
): Reaction[] {
    return [
        ...reactions,
        { emojiName, userIds: [userId] }
    ];
}

/**
 * Returns sorted emojis for a user: recent, frequent, then the rest.
 * 
 * @param user - The user for whom to sort emojis.
 * @param emojis - Full list of available emojis.
 * @returns Sorted list of emojis.
 */
export function getSortedEmojisForUser(user: User, emojis: Emoji[]): Emoji[] {
    if (!hasEmojiData(user)) {
        return getDefaultEmojis(emojis);
    }
    const recent = getRecentEmojis(user, emojis);
    const frequent = getFrequentEmojisExcludingRecent(user, emojis, recent);
    const remaining = getRemainingEmojis(emojis, recent, frequent);
    return [...recent, ...frequent, ...remaining];
}

/**
 * Checks if the user has any emoji data stored.
 * 
 * @returns True if user has recent or frequent emoji data.
 */
function hasEmojiData(user: User): boolean {
    return (
        (user.recentEmojis?.length ?? 0) > 0 ||
        Object.keys(user.emojiUsage ?? {}).length > 0
    );
}

/**
 * Gets frequent emojis excluding recently used ones.
 * 
 * @param recent - Emojis recently used by user.
 * @returns Frequently used emojis, excluding recent ones.
 */
function getFrequentEmojisExcludingRecent(
    user: User,
    emojis: Emoji[],
    recent: Emoji[]
): Emoji[] {
    const recentNames = recent.map((e) => e.name);
    return getFrequentEmojis(user, emojis, recentNames);
}

/**
 * Filters out emojis that are already in recent or frequent sets.
 * 
 * @param recent - Recently used emojis.
 * @param frequent - Frequently used emojis.
 * @returns Remaining emojis not in recent or frequent sets.
 */
function getRemainingEmojis(
    emojis: Emoji[],
    recent: Emoji[],
    frequent: Emoji[]
): Emoji[] {
    const excludeNames = [...recent, ...frequent].map((e) => e.name);
    return emojis.filter((e) => !excludeNames.includes(e.name));
}

/**
 * Returns all emojis as default fallback.
 * 
 * @param emojis - All available emojis.
 * @returns Full emoji list.
 */
function getDefaultEmojis(emojis: Emoji[]): Emoji[] {
    return [...emojis];
}

/**
 * Returns up to 2 recent emojis used by user.
 * 
 * @returns List of recent emojis.
 */
function getRecentEmojis(user: User, emojis: Emoji[]): Emoji[] {
    const recent = user.recentEmojis ?? [];
    return recent
        .slice(0, 2)
        .map((name) => emojis.find((e) => e.name === name))
        .filter((e): e is Emoji => !!e);
}

/**
 * Returns the user's most frequently used emojis (excluding the up to two 
 * most recently used), sorted by usage and matched from the emoji list.
 * 
 * @param excludeNames - Names to exclude from result.
 * @returns Sorted list of frequently used emojis.
 */
function getFrequentEmojis(
    user: User,
    emojis: Emoji[],
    excludeNames: string[]
): Emoji[] {
    const usage = user.emojiUsage ?? {};
    return Object.entries(usage)
        .filter(([name]) => !excludeNames.includes(name))
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => emojis.find((e) => e.name === name))
        .filter((e): e is Emoji => !!e);
}

/**
 * Updates recent and usage count of an emoji for a user.
 * 
 * @param user - The user object to update.
 * @param emojiName - Name of emoji used.
 * @returns Updated user object.
 */
export function updateEmojiDataForUser(user: User, emojiName: string): User {
    const recentEmojis = updateRecentEmojis(user.recentEmojis ?? [], emojiName);
    const emojiUsage = updateEmojiUsageCount(user.emojiUsage ?? {}, emojiName);
    const recentChanged = user.recentEmojis !== recentEmojis;
    const usageChanged = user.emojiUsage !== emojiUsage;
    if (!recentChanged && !usageChanged) {
        return user;
    }
    return {
        ...user,
        recentEmojis,
        emojiUsage
    };
}

/**
 * Updates the recent emojis list by placing the emoji at the front.
 * 
 * @param recent - Current recent emoji names.
 * @param emojiName - Name to move to front.
 * @returns Updated list of recent emojis (max 2).
 */
function updateRecentEmojis(recent: string[], emojiName: string): string[] {
    const filtered = recent.filter(e => e !== emojiName);
    const newRecent = [emojiName, ...filtered].slice(0, 2);

    const isEqual = recent.length === newRecent.length &&
        recent.every((val, index) => val === newRecent[index]);

    if (isEqual) {
        return recent;
    }

    return newRecent;
}

/**
 * Increments the usage count of an emoji.
 * 
 * @param usage - Current usage map.
 * @param emojiName - Emoji to increment.
 * @returns Updated usage object.
 */
function updateEmojiUsageCount(usage: { [key: string]: number }, emojiName: string): { [key: string]: number } {
    const oldCount = usage[emojiName] ?? 0;
    const newCount = oldCount + 1;

    if (oldCount === newCount) {
        return usage;
    }

    return {
        ...usage,
        [emojiName]: newCount
    };
}

/**
 * Merges new emoji usage data into existing usage map by incrementing counts.
 *
 * @param existing - The user's current emoji usage map.
 * @param incoming - New usage data to merge in.
 * @returns A new usage map with updated counts.
 */
export function mergeEmojiUsageMaps(
    existing: { [emojiName: string]: number },
    incoming: { [emojiName: string]: number }
): { [emojiName: string]: number } {
    const merged = { ...existing };
    for (const [name, count] of Object.entries(incoming)) {
        merged[name] = (merged[name] ?? 0) + count;
    }
    return merged;
}


/**
 * Adjusts the tooltip position if it overflows the container.
 * 
 * @param tooltipEl - The tooltip element.
 * @param containerEl - The container element for bounds checking.
 * @param extraOffset - Optional extra offset in pixels.
 */
export function applyTooltipOverflowAdjustment(
    tooltipEl: HTMLElement,
    containerEl: HTMLElement,
    extraOffset = 2
): void {
    const rect = tooltipEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    const visibleRight = containerRect.left + containerEl.clientWidth;
    const overflowRight = rect.right - visibleRight;
    tooltipEl.style.transform = overflowRight > 0
        ? `translateX(-${overflowRight + extraOffset}px)`
        : '';
}

/**
 * Returns visible emoji reactions depending on view state and limit.
 * 
 * @param message - The message with reactions.
 * @param showAll - Whether to show all reactions.
 * @param viewMode - Current UI mode.
 * @param isThreadView - Whether in thread view.
 * @returns Visible reactions.
 */
export function getVisibleReactions(
    message: Message,
    showAll: boolean,
    viewMode: ViewMode,
    isThreadView: boolean
): Reaction[] {
    const all = message.reactions || [];
    const limit = getReactionLimit(viewMode, isThreadView);
    return showAll ? all : all.slice(0, limit);
}

/**
 * Calculates number of hidden reactions due to limit.
 * 
 * @returns Number of hidden reactions.
 */
export function getHiddenReactionCount(
    message: Message,
    showAll: boolean,
    viewMode: ViewMode,
    isThreadView: boolean
): number {
    const all = message.reactions || [];
    const limit = getReactionLimit(viewMode, isThreadView);
    return !showAll && all.length > limit ? all.length - limit : 0;
}

/**
 * Determines maximum number of reactions to show based on view.
 * 
 * @param viewMode - Current UI mode.
 * @param isThreadView - Whether in thread view.
 * @returns Reaction display limit.
 */
function getReactionLimit(viewMode: ViewMode, isThreadView: boolean): number {
    if (viewMode === ViewMode.Mobile || isThreadView) return 7;
    return 20;
}

/**
 * Determines whether the "collapse" button should be shown.
 * 
 * @param message - Message with reactions.
 * @param showAllReactions - Map of message IDs to expanded states.
 * @param viewMode - Current UI mode.
 * @param isThreadView - Whether in thread view.
 * @returns True if collapse button should be shown.
 */
export function shouldShowCollapseButton(
    message: Message,
    showAllReactions: { [id: string]: boolean },
    viewMode: ViewMode,
    isThreadView: boolean
): boolean {
    const all = message.reactions || [];
    const limit = getReactionLimit(viewMode, isThreadView);
    return showAllReactions[message.id] === true && all.length > limit;
}