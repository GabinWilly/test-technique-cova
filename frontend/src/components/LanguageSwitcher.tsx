import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const LABELS: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
}

/**
 * Bascule de langue. i18next persiste le choix dans localStorage, donc il
 * survit au rechargement et repart dans l'en-tete Accept-Language des appels API.
 */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage as SupportedLanguage

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="inline-flex rounded-lg border border-slate-200 p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            current === lng
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {LABELS[lng]}
        </button>
      ))}
    </div>
  )
}
