// ============================================
// UTM Rules Configuration Types
// ============================================

export interface ParamRule {
  required: boolean;
  allowedValues?: string[];
  preferredValue?: string;
  warningIfNotPreferred?: boolean;
  allowKeywordMacro?: boolean;
  freeTextAllowed?: boolean;
}

export interface ChannelRules {
  utm_source?: ParamRule;
  utm_medium?: ParamRule;
  utm_campaign?: ParamRule;
  utm_content?: ParamRule;
  utm_term?: ParamRule;
}

export interface ChannelConfig {
  id: string;
  label: string;
  platform: string;
  trafficType: string;
  disallowUtm?: boolean;
  rules: ChannelRules;
}

export interface GlobalRules {
  requiredParams: string[];
  lowercaseOnly: boolean;
  allowedValuePattern: string;
  disallowSpaces: boolean;
  disallowMultipleQuestionMarks: boolean;
  requireAnyUtm: boolean;
}

export interface UtmRulesConfig {
  version: number;
  globalRules: GlobalRules;
  channels: ChannelConfig[];
}

// ============================================
// Parsed UTM Types
// ============================================

export interface ParsedUTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export const UTM_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UTMParamKey = (typeof UTM_PARAM_KEYS)[number];

// ============================================
// Validation Types
// ============================================

export interface ValidationMessage {
  type: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface ParseResult {
  success: boolean;
  error?: string;
  params?: ParsedUTMParams;
  rawUrl?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  messages: ValidationMessage[];
  parsedParams: ParsedUTMParams;
}
