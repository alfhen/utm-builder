// ============================================
// UTM Rules Configuration Types
// ============================================

export interface ParamRule {
  required: boolean;
  allowedValues?: string[];
  preferredValue?: string;
  warningIfNotPreferred?: boolean;
  warnIfMissing?: boolean;
  allowKeywordMacro?: boolean;
  freeTextAllowed?: boolean;
  suggestedUsage?: string;
  examples?: string[];
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

export interface UtmGuidance {
  description: string;
  examples: string[];
}

export interface GlobalRules {
  requiredParams: string[];
  lowercaseOnly: boolean;
  allowedValuePattern: string;
  disallowSpaces: boolean;
  disallowMultipleQuestionMarks: boolean;
  requireAnyUtm: boolean;
  utmContentGuidance?: UtmGuidance;
  utmTermGuidance?: UtmGuidance;
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
  param?: UTMParamKey;
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
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  messages: ValidationMessage[]; // Combined for backwards compatibility
  parsedParams: ParsedUTMParams;
  channelId: string;
}

// ============================================
// Tooltip / Guidance Types
// ============================================

export interface ParamGuidance {
  suggestedUsage?: string;
  examples?: string[];
}

export interface ChannelParamGuidance {
  utm_content?: ParamGuidance;
  utm_term?: ParamGuidance;
}
