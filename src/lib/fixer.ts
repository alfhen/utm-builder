import type { ParsedUTMParams, UTMParamKey } from './types';
import { UTM_PARAM_KEYS } from './types';

function toUrl(url: string): URL {
  return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
}

function reorderUtmParams(url: URL): string {
  const utmParams = new Map<string, string>();
  const otherParams: [string, string][] = [];

  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      utmParams.set(key, value);
    } else {
      otherParams.push([key, value]);
    }
  }

  url.search = '';
  for (const [key, value] of otherParams) {
    url.searchParams.append(key, value);
  }
  for (const key of UTM_PARAM_KEYS) {
    const value = utmParams.get(key);
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/** Sets (or, with an empty value, removes) one UTM parameter. Returns the input unchanged if it isn't a URL. */
export function setParam(url: string, key: UTMParamKey, value: string): string {
  try {
    const urlObj = toUrl(url);
    if (value) {
      urlObj.searchParams.set(key, value);
    } else {
      urlObj.searchParams.delete(key);
    }
    return reorderUtmParams(urlObj);
  } catch {
    return url;
  }
}

export function stripUtmParams(url: string): string {
  try {
    const urlObj = toUrl(url);
    for (const key of [...urlObj.searchParams.keys()]) {
      if (key.startsWith('utm_')) urlObj.searchParams.delete(key);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/** Applies a suggestion of the form "utm_source=google". */
export function applyFix(url: string, suggestion: string): string {
  const match = (suggestion.split(' or ')[0] ?? '').trim().match(/^(utm_\w+)=(.+)$/);
  if (!match || !(UTM_PARAM_KEYS as readonly string[]).includes(match[1]!)) return url;
  return setParam(url, match[1] as UTMParamKey, match[2]!);
}

export function buildCleanUrl(originalUrl: string, params: ParsedUTMParams): string {
  try {
    const url = toUrl(originalUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_')) url.searchParams.delete(key);
    }
    for (const key of UTM_PARAM_KEYS) {
      const value = params[key];
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return originalUrl;
  }
}
