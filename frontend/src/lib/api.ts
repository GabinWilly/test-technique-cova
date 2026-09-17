import axios, { AxiosError } from 'axios'

import i18n from '@/i18n'
import type { ApiErrorBody } from '@/types'

/**
 * Client HTTP unique de l'application.
 *
 * En developpement, '/api' est proxifie par Vite vers le backend
 * (voir vite.config.ts), donc le navigateur ne voit qu'une seule origine et
 * aucune question de CORS ne se pose.
 */
export const api = axios.create({ baseURL: '/api' })

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

/** Branche par AuthProvider : purge la session quand un jeton n'est plus accepte. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  // Le backend traduit ses messages selon cet en-tete.
  config.headers.set('Accept-Language', i18n.language)
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`)
  }
  return config
})

/** Un 401 sur ces routes signifie « mauvais identifiants », pas « session expiree ». */
function isAuthAttempt(url: string | undefined) {
  return url === '/auth/login' || url === '/auth/register'
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isAuthAttempt(error.config?.url)
    ) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/**
 * Nature d'un echec, qui decide de la facon de l'annoncer :
 * - `business` : une regle metier a refuse l'action (4xx) -> SweetAlert warning
 * - `failure`  : le serveur ou le reseau a laché (5xx, timeout) -> SweetAlert error
 */
export interface ApiFailure {
  kind: 'business' | 'failure'
  message: string
  fieldErrors?: Record<string, string>
  status?: number
}

export function describeError(error: unknown): ApiFailure {
  if (!axios.isAxiosError(error)) {
    return { kind: 'failure', message: i18n.t('errors.unexpected') }
  }

  const axiosError = error as AxiosError<ApiErrorBody>
  const response = axiosError.response

  // Pas de reponse du tout : serveur injoignable, requete annulee, delai depasse.
  if (!response) {
    return { kind: 'failure', message: i18n.t('errors.network') }
  }

  const body = response.data
  const status = response.status

  if (status >= 500) {
    return {
      kind: 'failure',
      status,
      message: body?.message ?? i18n.t('errors.unexpected'),
    }
  }

  return {
    kind: 'business',
    status,
    // Le message vient du backend, deja traduit ; on ne redefinit aucun texte metier.
    message: body?.message ?? i18n.t('errors.unexpected'),
    fieldErrors: body?.fieldErrors,
  }
}
