import { ClipboardList, Plus, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'

interface EmptyStateProps {
  /**
   * `no-tasks` : le compte est vide, on invite a creer.
   * `no-results` : des taches existent mais aucune ne passe le filtre,
   * proposer « Nouvelle tâche » serait ici un contresens.
   */
  variant: 'no-tasks' | 'no-results'
  onCreate: () => void
  onClearFilters: () => void
}

export function EmptyState({ variant, onCreate, onClearFilters }: EmptyStateProps) {
  const { t } = useTranslation()
  const isNoResults = variant === 'no-results'
  const Icon = isNoResults ? SearchX : ClipboardList

  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-ground px-5 py-10 text-center">
      <Icon size={30} aria-hidden="true" className="mx-auto mb-3 text-muted" strokeWidth={1.5} />
      <p className="text-sm font-semibold text-ink">
        {isNoResults ? t('task.noResultsTitle') : t('task.emptyTitle')}
      </p>
      <p className="mx-auto mt-1 max-w-[34ch] text-xs text-muted">
        {isNoResults ? t('task.noResultsHint') : t('task.emptyHint')}
      </p>
      <div className="mt-4 flex justify-center">
        {isNoResults ? (
          <Button variant="ghost" onClick={onClearFilters}>
            {t('task.clearFilters')}
          </Button>
        ) : (
          <Button onClick={onCreate}>
            <Plus size={14} aria-hidden="true" />
            {t('task.newTask')}
          </Button>
        )}
      </div>
    </div>
  )
}
