import type {
  ParsedUTMParams,
  ValidationMessage,
  ValidationResult,
  ChannelConfig,
  ParamRule,
  UTMParamKey,
} from './types';
import { getChannelById, getGlobalRules } from './rules';
import { isLowercase, hasSpaces } from './parser';

/**
 * Smart cleanup of UTM values:
 * - Transliterate special characters (ø→o, å→a, etc.)
 * - Replace spaces and dashes with underscores
 * - Collapse multiple underscores
 * - Lowercase everything
 * - Preserve {keyword} macro if present
 */
function cleanUtmValue(value: string, preserveKeywordMacro = false): string {
  const transliterations: Record<string, string> = {
    'ø': 'o', 'ö': 'o', 'ô': 'o', 'ò': 'o', 'ó': 'o', 'õ': 'o',
    'å': 'a', 'ä': 'a', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
    'æ': 'ae',
    'ü': 'u', 'ù': 'u', 'ú': 'u', 'û': 'u',
    'ë': 'e', 'è': 'e', 'é': 'e', 'ê': 'e',
    'ï': 'i', 'ì': 'i', 'í': 'i', 'î': 'i',
    'ÿ': 'y', 'ý': 'y',
    'ñ': 'n',
    'ç': 'c',
    'ß': 'ss',
  };

  // Temporarily replace {keyword} with a placeholder if we need to preserve it
  const keywordPlaceholder = '__KEYWORD_MACRO__';
  let result = value;
  
  if (preserveKeywordMacro) {
    result = result.replace(/\{keyword\}/gi, keywordPlaceholder);
  }
  
  result = result.toLowerCase();

  for (const [from, to] of Object.entries(transliterations)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }

  result = result.replace(/[\s\-–—]+/g, '_');
  result = result.replace(/[^a-z0-9_]/g, '');
  result = result.replace(/_+/g, '_');
  result = result.replace(/^_+|_+$/g, '');

  // Restore {keyword} macro
  if (preserveKeywordMacro) {
    result = result.replace(new RegExp(keywordPlaceholder, 'g'), '{keyword}');
  }

  return result;
}

/**
 * Get the default value for a UTM parameter based on channel config
 */
function getDefaultValue(param: UTMParamKey, channel: ChannelConfig): string {
  const rule = channel.rules[param];
  
  // If the rule has a preferred value, use it
  if (rule?.preferredValue) {
    return rule.preferredValue;
  }
  
  // If the rule has allowed values, use the first one
  if (rule?.allowedValues && rule.allowedValues.length > 0) {
    return rule.allowedValues[0]!;
  }
  
  // Default values based on parameter type and channel
  switch (param) {
    case 'utm_source':
      return channel.platform ?? 'source';
    case 'utm_medium':
      return channel.trafficType === 'paid' ? 'paid' : 'organic';
    case 'utm_campaign':
      return 'campaign_name';
    case 'utm_content':
      return 'content';
    case 'utm_term':
      return 'term';
  }
}

/**
 * Check if a value matches the global allowed pattern
 */
function isValidUtmValue(value: string, allowKeywordMacro = false): boolean {
  if (!value) return false;

  let checkValue = value;
  if (allowKeywordMacro) {
    // Replace {keyword} with a valid placeholder for pattern checking
    checkValue = value.replace(/\{keyword\}/g, 'keyword_placeholder');
  }

  const globalRules = getGlobalRules();
  const pattern = new RegExp(globalRules.allowedValuePattern);
  return pattern.test(checkValue);
}

/**
 * Validate UTM parameters against global and channel-specific rules
 */
export function validateUtmParams(
  params: ParsedUTMParams,
  channelId: string
): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const globalRules = getGlobalRules();
  const channel = getChannelById(channelId);

  if (!channel) {
    errors.push({
      type: 'error',
      message: `Unknown channel: ${channelId}`,
    });
    return {
      isValid: false,
      hasWarnings: false,
      errors,
      warnings,
      messages: errors,
      parsedParams: params,
      channelId,
    };
  }

  // Check if this channel disallows UTMs entirely (e.g., Google organic)
  if (channel.disallowUtm) {
    const hasAnyUtm = Object.values(params).some((v) => v);
    if (hasAnyUtm) {
      errors.push({
        type: 'error',
        message: 'This channel does not permit UTM parameters. Remove all UTM parameters for organic search traffic.',
      });
    }
    return {
      isValid: errors.length === 0,
      hasWarnings: false,
      errors,
      warnings,
      messages: errors,
      parsedParams: params,
      channelId,
    };
  }

  // --- Global Rules ---

  // Check required parameters from global rules
  for (const param of globalRules.requiredParams) {
    const value = params[param as keyof ParsedUTMParams];
    if (!value || value.trim() === '') {
      // Get the default value from channel rules
      const defaultValue = getDefaultValue(param as UTMParamKey, channel);
      errors.push({
        type: 'error',
        param: param as UTMParamKey,
        message: `Missing required parameter: ${param}`,
        suggestion: `${param}=${defaultValue}`,
      });
    }
  }

  // Check all UTM values for global rules
  const allParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

  for (const param of allParams) {
    const value = params[param];
    if (!value) continue;

    const paramRule = channel.rules[param];
    const allowKeywordMacro = paramRule?.allowKeywordMacro || false;
    const cleanedValue = cleanUtmValue(value, allowKeywordMacro);

    if (globalRules.disallowSpaces && hasSpaces(value)) {
      errors.push({
        type: 'error',
        param,
        message: `${param} contains spaces: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    } else if (globalRules.lowercaseOnly && !isLowercase(value)) {
      errors.push({
        type: 'error',
        param,
        message: `${param} must be lowercase: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    } else if (!isValidUtmValue(value, allowKeywordMacro)) {
      errors.push({
        type: 'error',
        param,
        message: `${param} contains invalid characters. Only a-z, 0-9, and underscores are allowed: "${value}"`,
        suggestion: `${param}=${cleanedValue}`,
      });
    }
  }

  // --- Channel-Specific Rules ---
  validateChannelRules(params, channel, errors, warnings);

  // Combine messages for backwards compatibility
  const messages = [...errors, ...warnings];

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    messages,
    parsedParams: params,
    channelId,
  };
}

/**
 * Validate channel-specific rules
 */
function validateChannelRules(
  params: ParsedUTMParams,
  channel: ChannelConfig,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
) {
  const rules = channel.rules;

  // Validate each parameter against its rules
  for (const [param, rule] of Object.entries(rules) as [keyof ParsedUTMParams, ParamRule][]) {
    if (!rule) continue;

    const value = params[param];

    // Handle missing values
    if (!value || value.trim() === '') {
      // Check for warnIfMissing (soft warning for missing optional params)
      if (rule.warnIfMissing) {
        const examples = rule.examples?.length ? ` (e.g., ${rule.examples.slice(0, 2).join(', ')})` : '';
        warnings.push({
          type: 'warning',
          param: param as UTMParamKey,
          message: `${param} is recommended for ${channel.label}${examples}`,
        });
      }
      continue;
    }

    // Check if parameter has allowed values
    if (rule.allowedValues && rule.allowedValues.length > 0) {
      if (!rule.allowedValues.includes(value)) {
        // If freeTextAllowed is true, allow any lowercase value
        if (rule.freeTextAllowed) {
          // Value is allowed as free text, no error
        } else {
          const suggestion = rule.preferredValue
            ? `${param}=${rule.preferredValue}`
            : `${param}=${rule.allowedValues[0]}`;

          errors.push({
            type: 'error',
            param: param as UTMParamKey,
            message: `For ${channel.label}, ${param} must be "${rule.allowedValues.join('" or "')}", got "${value}"`,
            suggestion,
          });
        }
      } else if (rule.warningIfNotPreferred && rule.preferredValue && value !== rule.preferredValue) {
        // Value is allowed but not preferred - show warning with fix option
        warnings.push({
          type: 'warning',
          param: param as UTMParamKey,
          message: `Using "${value}" as ${param} is acceptable, but "${rule.preferredValue}" is recommended for consistency`,
          suggestion: `${param}=${rule.preferredValue}`,
        });
      }
    } else if (rule.freeTextAllowed) {
      // No allowed values but free text is allowed - any valid lowercase value is fine
      // (Global rules already checked for valid format)
    }
  }
}

/**
 * Get parameter guidance from channel config
 */
export function getParamGuidance(
  channelId: string,
  param: 'utm_content' | 'utm_term'
): { suggestedUsage?: string; examples?: string[] } | null {
  const channel = getChannelById(channelId);
  if (!channel) return null;

  const rule = channel.rules[param];
  if (!rule) return null;

  return {
    suggestedUsage: rule.suggestedUsage,
    examples: rule.examples,
  };
}

/**
 * Build a clean URL from current URL and params
 */
export function buildCleanUrl(originalUrl: string, params: ParsedUTMParams): string {
  try {
    // Parse the original URL
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
