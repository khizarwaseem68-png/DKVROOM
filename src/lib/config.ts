// ============================================================
// DK Vroom — Feature Flags & Configuration
// ============================================================

export function getConfig(key: string, defaultValue: string = 'false'): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue
  }
  return defaultValue
}

export function isFeatureEnabled(key: string, defaultValue: boolean = false): boolean {
  return getConfig(key, String(defaultValue)) === 'true'
}

export const FEATURES = {
  showReviewModule:false
} as const
