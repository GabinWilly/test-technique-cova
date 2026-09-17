const TOKEN_KEY = 'taskmanager.token'

/**
 * Le jeton est conserve dans localStorage pour survivre au rechargement.
 *
 * Chaque acces est protege : en navigation privee ou avec les donnees de site
 * bloquees, localStorage peut lever une exception. L'application doit alors
 * continuer de fonctionner, simplement sans se souvenir de la session.
 */
export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* stockage indisponible : la session ne durera que le temps de l'onglet */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* rien a nettoyer si le stockage est inaccessible */
  }
}
