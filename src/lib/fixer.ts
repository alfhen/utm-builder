import type { ParsedUTMParams, UTMParamKey } from './types';
import { UTM_PARAM_KEYS } from './types';
import { managedUtmKey, toUrl } from './parser';

/**
 * Rewrites the query with the five managed UTM keys last, in standard order and lowercase.
 * Only the first occurrence of a managed key is kept, matching what parseUrl reads.
 * Every other parameter, including other utm_* keys such as utm_id, is kept in place.
 */
function withUtmParams(url: URL, overrides: Partial<Record<UTMParamKey, string>> = {}): string {
  const managed = new Map<UTMParamKey, string>();
  const others: [string, string][] = [];

  for (const [key, value] of url.searchParams.entries()) {
    const utmKey = managedUtmKey(key);
    if (!utmKey) others.push([key, value]);
    else if (!managed.has(utmKey)) managed.set(utmKey, value);
  }

  url.search = '';
  for (const [key, value] of others) url.searchParams.append(key, value);
  for (const key of UTM_PARAM_KEYS) {
    const value = key in overrides ? overrides[key] : managed.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Sets (or, with an empty value, removes) one UTM parameter. Returns the input unchanged if it isn't a URL. */
export function setParam(url: string, key: UTMParamKey, value: string): string {
  try {
    return withUtmParams(toUrl(url), { [key]: value });
  } catch {
    return url;
  }
}

export function stripUtmParams(url: string): string {
  try {
    const urlObj = toUrl(url);
    for (const key of [...new Set(urlObj.searchParams.keys())]) {
      if (key.toLowerCase().startsWith('utm_')) urlObj.searchParams.delete(key);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/** Applies a suggestion of the form "utm_source=google". */
export function applyFix(url: string, suggestion: string): string {
  const match = (suggestion.split(' or ')[0] ?? '').trim().match(/^(utm_\w+)=(.+)$/);
  const key = match && managedUtmKey(match[1]!);
  return key ? setParam(url, key, match[2]!) : url;
}

export function buildCleanUrl(originalUrl: string, params: ParsedUTMParams): string {
  try {
    const overrides = Object.fromEntries(UTM_PARAM_KEYS.map((key) => [key, params[key] ?? '']));
    return withUtmParams(toUrl(originalUrl), overrides);
  } catch {
    return originalUrl;
  }
}
