import 'i18next'

import type fr from './locales/fr.json'

/**
 * Typage des cles de traduction : t('task.statuses.TODO') est verifie a la
 * compilation, et une cle inexistante devient une erreur TypeScript.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof fr
    }
  }
}
