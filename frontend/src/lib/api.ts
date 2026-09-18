import i18n from '@/i18n'
import type { ApiErrorBody } from '@/types'

/**
 * Client HTTP de l'application, bati sur l'API fetch du navigateur.
 *
 * En developpement, '/api' est proxifie par Vite vers le backend
 * (voir vite.config.ts), donc le navigateur ne voit qu'une seule origine.
 */
const BASE_URL = '/api'

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

/** Branche par AuthProvider : purge la session quand un jeton n'est plus accepte. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

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

/** Erreur levee par le client. Porte deja tout ce qu'il faut pour l'afficher. */
export class ApiError extends Error implements ApiFailure {
  readonly kind: 'business' | 'failure'
  readonly fieldErrors?: Record<string, string>
  readonly status?: number

  constructor(failure: ApiFailure) {
    super(failure.message)
    this.name = 'ApiError'
    this.kind = failure.kind
    this.fieldErrors = failure.fieldErrors
    this.status = failure.status
  }
}

/** Un 401 sur ces routes signifie « mauvais identifiants », pas « session expiree ». */
function isAuthAttempt(path: string) {
  return path === '/auth/login' || path === '/auth/register'
}

type Query = Record<string, string | undefined>

function buildUrl(path: string, query?: Query) {
  if (!query) return BASE_URL + path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    // Un parametre absent ne doit pas partir en chaine vide : le backend
    // traiterait `status=` comme un filtre et ne renverrait rien.
    if (value !== undefined && value !== '') params.set(key, value)
  }
  const queryString = params.toString()
  return queryString ? `${BASE_URL}${path}?${queryString}` : BASE_URL + path
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<T> {
  const headers = new Headers({
    // Le backend traduit ses messages selon cet en-tete.
    'Accept-Language': i18n.language,
  })
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    // fetch ne rejette que sur un echec reseau : serveur injoignable, requete
    // annulee, DNS. Un code 4xx ou 5xx, lui, resout normalement.
    throw new ApiError({ kind: 'failure', message: i18n.t('errors.network') })
  }

  if (response.ok) {
    // 204 No Content sur la suppression : pas de corps a analyser.
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  if (response.status === 401 && !isAuthAttempt(path)) {
    onUnauthorized?.()
  }

  const body = await readErrorBody(response)
  throw new ApiError({
    kind: response.status >= 500 ? 'failure' : 'business',
    status: response.status,
    // Le message vient du backend, deja traduit ; on ne redefinit aucun
    // texte metier cote client.
    message: body?.message ?? i18n.t('errors.unexpected'),
    fieldErrors: body?.fieldErrors,
  })
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody
  } catch {
    // Une erreur d'infrastructure peut renvoyer du HTML plutot que du JSON.
    return null
  }
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  delete: (path: string) => request<void>('DELETE', path),
}

export function describeError(error: unknown): ApiFailure {
  if (error instanceof ApiError) {
    return {
      kind: error.kind,
      message: error.message,
      fieldErrors: error.fieldErrors,
      status: error.status,
    }
  }
  return { kind: 'failure', message: i18n.t('errors.unexpected') }
}
