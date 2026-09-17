export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** Limites reelles des colonnes MySQL, reprises des entites JPA. */
export const TITLE_MAX_LENGTH = 150
export const DESCRIPTION_MAX_LENGTH = 2000
export const PASSWORD_MIN_LENGTH = 8

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface TaskPayload {
  title: string
  description?: string | null
  status?: TaskStatus
}

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  expiresIn: number
  user: User
}

/** Corps d'erreur de l'API (voir ApiError cote backend). */
export interface ApiErrorBody {
  status: number
  message: string
  fieldErrors?: Record<string, string>
  timestamp: string
}
