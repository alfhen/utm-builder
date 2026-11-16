import type { ParseResult, ParsedUTMParams, UTMParamKey } from './types';
import { UTM_PARAM_KEYS } from './types';

/** Parses user input as a URL: trims it and assumes https:// when no http(s) scheme is given. Throws if invalid. */
export function toUrl(input: string): URL {
  const trimmed = input.trim();
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

/** Maps a query key to the managed UTM key it names, ignoring case. */
export function managedUtmKey(key: string): UTMParamKey | undefined {
  const lower = key.toLowerCase();
  return (UTM_PARAM_KEYS as readonly string[]).includes(lower) ? (lower as UTMParamKey) : undefined;
}

export function parseUrl(input: string): ParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { success: false, error: 'Please enter a URL to validate.' };
  }

  const beforeHash = trimmed.split('#')[0] ?? '';
  if ((beforeHash.match(/\?/g) || []).length > 1) {
    return {
      success: false,
      error: 'This URL has more than one "?". Only one is allowed, before the query string.',
    };
  }

  let url: URL;
  try {
    url = toUrl(trimmed);
  } catch {
    return {
      success: false,
      error: 'This doesn’t look like a URL. Try something like https://example.com/page.',
    };
  }

  const params: ParsedUTMParams = {};
  for (const [key, value] of url.searchParams.entries()) {
    const managed = managedUtmKey(key);
    if (managed && params[managed] === undefined) params[managed] = value;
  }

  return { success: true, params, rawUrl: trimmed };
}

export function isLowercase(value: string): boolean {
  return value === value.toLowerCase();
}

export function hasSpaces(value: string): boolean {
  return /\s/.test(value);
}
