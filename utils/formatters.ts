/**
 * Date and time formatting utilities
 */

/**
 * Format a date string for display in event cards
 * Example: "Mon, Jan 15, 3:30 PM"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Format a date string for detailed views
 * Example: "Monday, January 15, 3:30 PM"
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Format a date for game time display
 * Example: "3:30 PM"
 */
export function formatGameTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffDay) >= 7) {
    return formatDate(dateString);
  }

  if (diffSec < 0) {
    // Past
    if (diffSec > -60) return 'just now';
    if (diffMin > -60) return `${Math.abs(diffMin)} min ago`;
    if (diffHour > -24) return `${Math.abs(diffHour)} hour${Math.abs(diffHour) !== 1 ? 's' : ''} ago`;
    return `${Math.abs(diffDay)} day${Math.abs(diffDay) !== 1 ? 's' : ''} ago`;
  } else {
    // Future
    if (diffSec < 60) return 'in a moment';
    if (diffMin < 60) return `in ${diffMin} min`;
    if (diffHour < 24) return `in ${diffHour} hour${diffHour !== 1 ? 's' : ''}`;
    return `in ${diffDay} day${diffDay !== 1 ? 's' : ''}`;
  }
}

/**
 * Format a date for chat message timestamps
 * Example: "3:30 PM" for today, "Yesterday" for yesterday, "Mon, Jan 15" for older
 */
export function formatChatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return formatGameTime(dateString);
  }

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a user's name for display
 * Example: "John D." or "John" if no last name
 */
export function formatUserName(firstName: string, lastName?: string): string {
  if (!lastName) return firstName || 'Unknown';
  return `${firstName} ${lastName.charAt(0)}.`;
}

/**
 * Format a skill rating for display
 */
export function formatRating(rating: number): string {
  return Math.round(rating).toString();
}

/**
 * Format a score display
 * Example: "3 - 2"
 */
export function formatScore(score1: number, score2: number): string {
  return `${score1} - ${score2}`;
}
