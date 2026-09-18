import type { TaskStatus } from '@/types'

/**
 * Couleur de la barre laterale des cartes.
 *
 * Isolee hors du composant : un fichier qui exporte autre chose que des
 * composants perd le rafraichissement a chaud de Vite.
 */
export const STATUS_STRIPE: Record<TaskStatus, string> = {
  TODO: 'bg-todo',
  IN_PROGRESS: 'bg-doing',
  DONE: 'bg-done',
}

/** Fond et texte de l'etiquette de statut. */
export const STATUS_TONE: Record<TaskStatus, string> = {
  TODO: 'bg-todo-soft text-todo',
  IN_PROGRESS: 'bg-doing-soft text-doing',
  DONE: 'bg-done-soft text-done',
}
