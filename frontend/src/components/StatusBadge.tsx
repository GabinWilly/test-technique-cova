import { useTranslation } from 'react-i18next'

import { STATUS_TONE } from '@/lib/taskStatus'
import type { TaskStatus } from '@/types'

/**
 * Le statut n'est jamais porte par la seule couleur : l'etiquette affiche
 * toujours son texte, et la carte ajoute une barre laterale.
 */
export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${STATUS_TONE[status]}`}
    >
      {t(`task.statuses.${status}`)}
    </span>
  )
}
