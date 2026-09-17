import type { TaskStatus } from '@/types'

/**
 * Couleur de la barre laterale des cartes.
 *
 * Isolee hors du composant : un fichier qui exporte autre chose que des
 * composants perd le rafraichissement a chaud de Vite.
 */
export const STATUS_STRIPE: Record<TaskStatus, string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-amber-500',
  DONE: 'bg-emerald-600',
}

/** Fond et texte de l'etiquette de statut. */
export const STATUS_TONE: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-800',
}
