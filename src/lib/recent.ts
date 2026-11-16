export interface RecentLink {
  url: string;
  channelLabel: string;
  campaign: string;
  copiedAt: number;
}

const STORAGE_KEY = 'utm-builder:recent';

function isRecentLink(value: unknown): value is RecentLink {
  const link = value as RecentLink | null;
  return (
    typeof link === 'object' &&
    link !== null &&
    typeof link.url === 'string' &&
    typeof link.channelLabel === 'string' &&
    typeof link.campaign === 'string' &&
    Number.isFinite(link.copiedAt)
  );
}

export function loadRecentLinks(): RecentLink[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRecentLink) : [];
  } catch {
    return [];
  }
}

export function saveRecentLinks(links: RecentLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Private mode or blocked storage: history is a convenience, so drop it silently.
  }
}
