import { Emoji } from '../interfaces/emojis.interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { ViewMode } from '../enums/view-mode.enum';

export function getEmojiByName(
    emojis: Emoji[],
    name: string
): Emoji | undefined {
    return emojis.find((e) => e.name === name);
}

export function getEmojiByUnicode(
    emojis: Emoji[],
    unicode: string
): Emoji | undefined {
    return emojis.find((e) => e.unicode === unicode);
}

export function addEmojiToTextarea(
    textareaContent: string,
    unicodeEmoji: string
): string {
    return textareaContent + unicodeEmoji;
}

export function addEmojiToMessage(
    emojiName: string,
    message: Message,
    userId: string
): Message {
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

function addUserToReaction(
    reactions: Reaction[],
    target: Reaction,
    userId: string
): Reaction[] {
    return reactions.map(r =>
        r === target ? { ...r, userIds: [...r.userIds, userId] } : r
    );
}

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

export function getSortedEmojisForUser(user: User, emojis: Emoji[]): Emoji[] {
    if (!hasEmojiData(user)) {
        return getDefaultEmojis(emojis);
    }

    const recent = getRecentEmojis(user, emojis);
    const frequent = getFrequentEmojisExcludingRecent(user, emojis, recent);
    const remaining = getRemainingEmojis(emojis, recent, frequent);

    return [...recent, ...frequent, ...remaining];
}

function hasEmojiData(user: User): boolean {
    return (
        (user.recentEmojis?.length ?? 0) > 0 ||
        Object.keys(user.emojiUsage ?? {}).length > 0
    );
}

function getFrequentEmojisExcludingRecent(
    user: User,
    emojis: Emoji[],
    recent: Emoji[]
): Emoji[] {
    const recentNames = recent.map((e) => e.name);
    return getFrequentEmojis(user, emojis, recentNames);
}

function getRemainingEmojis(
    emojis: Emoji[],
    recent: Emoji[],
    frequent: Emoji[]
): Emoji[] {
    const excludeNames = [...recent, ...frequent].map((e) => e.name);
    return emojis.filter((e) => !excludeNames.includes(e.name));
}

function getDefaultEmojis(emojis: Emoji[]): Emoji[] {
    return [...emojis];
}

function getRecentEmojis(user: User, emojis: Emoji[]): Emoji[] {
    const recent = user.recentEmojis ?? [];
    return recent
        .slice(0, 2)
        .map((name) => emojis.find((e) => e.name === name))
        .filter((e): e is Emoji => !!e);
}

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

function getReactionLimit(viewMode: ViewMode, isThreadView: boolean): number {
    if (viewMode === ViewMode.Mobile || isThreadView) return 7;
    return 20;
}

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



