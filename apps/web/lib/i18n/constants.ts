export const SUPPORTED_LANGUAGES = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ar'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]

export const LANGUAGE_FLAGS: Record<SupportedLang, string> = {
  en: '🇬🇧', es: '🇪🇸', pt: '🇧🇷',
  fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', ar: '🇸🇦',
}

export const LANGUAGE_NAMES: Record<SupportedLang, string> = {
  en: 'English', es: 'Español', pt: 'Português',
  fr: 'Français', de: 'Deutsch', it: 'Italiano', ar: 'العربية',
}
