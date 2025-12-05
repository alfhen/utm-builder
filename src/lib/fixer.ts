/**
 * Apply a UTM parameter fix to a URL
 * @param url - The original URL
 * @param suggestion - The suggestion string (e.g., "utm_source=google" or "utm_source=facebook or utm_source=instagram")
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
    
    return urlObj.toString();
  } catch {
    return url;
  }
}
