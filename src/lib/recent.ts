export interface RecentLink {
  url: string;
  channelLabel: string;
  campaign: string;
  copiedAt: number;
}

const STORAGE_KEY = 'utm-builder:recent';

export function loadRecentLinks(): RecentLink[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
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
