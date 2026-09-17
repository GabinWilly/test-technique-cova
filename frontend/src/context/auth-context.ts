import { createContext } from 'react'

import type { User } from '@/types'

export interface AuthContextValue {
  user: User | null
  /** true tant qu'on verifie le jeton trouve au demarrage. */
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

/**
 * Contexte isole dans son propre fichier : il ne contient qu'une valeur,
 * donc le module reste compatible avec le rafraichissement a chaud de Vite,
 * qui exige qu'un fichier de composants n'exporte que des composants.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
