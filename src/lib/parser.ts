import type { ParseResult, ParsedUTMParams } from './types';

/**
 * Parse a URL and extract UTM parameters
 */
export function parseUrl(input: string): ParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      success: false,
      error: 'Please enter a URL to validate.',
    };
  }

  // Check for multiple ? before query string (malformed URL)
  const questionMarkCount = (trimmed.match(/\?/g) || []).length;
  if (questionMarkCount > 1) {
    return {
      success: false,
      error: 'Invalid URL: Multiple "?" characters detected. A valid URL should have only one "?" before the query string.',
    };
  }

  // Try to parse as URL
  let url: URL;
  try {
    // If no protocol, prepend https://
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    
    url = new URL(urlString);
  } catch {
    return {
      success: false,
      error: 'Invalid URL format. Please enter a valid URL (e.g., https://example.com?utm_source=google).',
    };
  }

  // Extract UTM parameters
  const params: ParsedUTMParams = {};
  const searchParams = url.searchParams;

  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const) {
    const value = searchParams.get(key);
    if (value !== null) {
      params[key] = value;
    }
  }

  // Return success even with no UTM params - user can add them via the editable table
  return {
    success: true,
    params,
    rawUrl: trimmed,
  };
}

/**
 * Check if a UTM value contains only valid characters (a-z, 0-9, underscore)
 * Special case: allows {keyword} macro for Google Ads utm_term
 */
export function isValidUtmValue(value: string, allowMacro = false): boolean {
  if (!value) return false;
  
  // If macros are allowed, temporarily replace {keyword} with a placeholder
  let checkValue = value;
  if (allowMacro) {
    checkValue = value.replace(/\{keyword\}/g, 'keyword_placeholder');
  }
  
  // Only allow a-z, 0-9, and underscore
  return /^[a-z0-9_]+$/.test(checkValue);
}

/**
 * Check if a UTM value is lowercase
 */
export function isLowercase(value: string): boolean {
  return value === value.toLowerCase();
}

/**
 * Check if a UTM value contains spaces
 */
export function hasSpaces(value: string): boolean {
  return /\s/.test(value);
}

