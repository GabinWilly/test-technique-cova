import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

import i18n from '@/i18n'

import { describeError } from './api'

/**
 * Boites de dialogue de l'application.
 *
 * Deux regles tiennent tout le fichier :
 *  - un refus de regle metier s'affiche en *warning*, jamais en rouge ;
 *    l'icone error est reservee aux vraies pannes serveur ou reseau ;
 *  - aucune boite native du navigateur (confirm, alert) n'est utilisee.
 */
const dialog = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'rounded-xl',
    title: 'font-display text-lg font-semibold text-ink',
    htmlContainer: 'text-sm text-muted',
    confirmButton:
      'inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    // Le bouton d'une action destructrice est en warn, pas en rouge : c'est une
    // action volontaire, pas une erreur.
    denyButton:
      'inline-flex items-center justify-center rounded-md bg-warn px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-warn/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-warn focus-visible:ring-offset-2',
    cancelButton:
      'mr-2 inline-flex items-center justify-center rounded-md border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-ground focus:outline-none focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:ring-offset-2',
  },
})

/** Refus metier : l'action est comprise mais refusee. */
export function showWarning(message: string) {
  return dialog.fire({
    icon: 'warning',
    title: i18n.t('alerts.warningTitle'),
    text: message,
    confirmButtonText: i18n.t('common.gotIt'),
  })
}

/** Panne reelle : serveur indisponible, reseau coupe, 500. */
export function showError(message: string) {
  return dialog.fire({
    icon: 'error',
    title: i18n.t('alerts.errorTitle'),
    text: message,
    confirmButtonText: i18n.t('common.gotIt'),
  })
}

/**
 * Annonce une erreur d'API en choisissant l'icone selon sa nature,
 * et rend le detail pour que l'appelant puisse placer les erreurs de champ.
 */
export function reportError(error: unknown) {
  const failure = describeError(error)

  // Les erreurs de validation s'affichent sous les champs concernes,
  // pas dans une boite qui masquerait le formulaire.
  const hasFieldErrors =
    failure.fieldErrors !== undefined && Object.keys(failure.fieldErrors).length > 0

  if (!hasFieldErrors) {
    if (failure.kind === 'business') {
      void showWarning(failure.message)
    } else {
      void showError(failure.message)
    }
  }

  return failure
}

/** Confirmation d'une action destructrice. Le bouton est en warning, pas en rouge. */
export async function confirmDelete(taskTitle: string): Promise<boolean> {
  const result = await dialog.fire({
    icon: 'warning',
    title: i18n.t('alerts.confirmDeleteTitle'),
    text: i18n.t('alerts.confirmDeleteText', { title: taskTitle }),
    showCancelButton: true,
    showConfirmButton: false,
    showDenyButton: true,
    denyButtonText: i18n.t('common.delete'),
    cancelButtonText: i18n.t('common.cancel'),
    focusCancel: true,
  })
  return result.isDenied
}
