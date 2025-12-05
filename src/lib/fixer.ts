import type { ParsedUTMParams, ValidationMessage } from './types';

/**
 * Apply a UTM parameter fix to a URL
 * @param url - The original URL
 * @param suggestion - The suggestion string (e.g., "utm_source=google" or "Add utm_source to your URL")
 * @returns The fixed URL
 */
export function applyFix(url: string, suggestion: string): string {
  try {
    // Handle suggestions like "utm_source=facebook or utm_source=instagram" - take the first one
    const parts = suggestion.split(' or ');
    const firstSuggestion = (parts[0] ?? '').trim();

    // Parse param=value format
    const match = firstSuggestion.match(/^(utm_\w+)=(.+)$/);
    if (!match) return url;

    const param = match[1];
    const value = match[2];

    if (!param || !value) return url;

    // Parse and update the URL
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    urlObj.searchParams.set(param, value);

    // Rebuild URL with params in correct order
    return reorderUtmParams(urlObj);
  } catch {
    return url;
  }
}

/**
 * Apply multiple fixes to a URL
 * Only applies fixes from error messages, not warnings
 */
export function applyAllFixes(url: string, messages: ValidationMessage[]): string {
  let currentUrl = url;
  
  // Only fix errors, not warnings
  const errorFixes = messages
    .filter((m) => m.type === 'error' && m.suggestion)
    .map((m) => m.suggestion!);

  for (const suggestion of errorFixes) {
    currentUrl = applyFix(currentUrl, suggestion);
  }

  return currentUrl;
}

/**
 * Reorder UTM params in standard order
 */
function reorderUtmParams(url: URL): string {
  const utmOrder = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  
  // Collect all params
  const utmParams: Map<string, string> = new Map();
  const otherParams: [string, string][] = [];
  
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      utmParams.set(key, value);
    } else {
      otherParams.push([key, value]);
    }
  }
  
  // Clear and rebuild
  url.search = '';
  
  // Add non-UTM params first (preserve original order)
  for (const [key, value] of otherParams) {
    url.searchParams.set(key, value);
  }
  
  // Add UTM params in standard order
  for (const param of utmOrder) {
    const value = utmParams.get(param);
    if (value !== undefined) {
      url.searchParams.set(param, value);
    }
  }
  
  return url.toString();
}

/**
 * Build a clean URL with properly formatted UTM params
 */
export function buildCleanUrl(originalUrl: string, params: ParsedUTMParams): string {
  try {
    const urlString = originalUrl.startsWith('http://') || originalUrl.startsWith('https://')
      ? originalUrl
      : `https://${originalUrl}`;

    const url = new URL(urlString);

    // Get all non-UTM params first
    const nonUtmParams: [string, string][] = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (!key.startsWith('utm_')) {
        nonUtmParams.push([key, value]);
      }
    }

    // Clear and rebuild search params
    url.search = '';

    // Add non-UTM params first
    for (const [key, value] of nonUtmParams) {
      url.searchParams.set(key, value);
    }

    // Add UTM params in standard order
    const utmOrder = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
    for (const key of utmOrder) {
      const value = params[key];
      if (value) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  } catch {
    return originalUrl;
  }
}
