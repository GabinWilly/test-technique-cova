import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { TASK_STATUSES, type TaskStatus } from '@/types'

export interface TaskCounts {
  all: number
  TODO: number
  IN_PROGRESS: number
  DONE: number
}

interface TaskFiltersProps {
  search: string
  status: TaskStatus | null
  /**
   * Compteurs calcules sur la liste *non filtree*. Les deduire de la liste
   * affichee serait faux : le serveur l'a deja filtree, donc « À faire · 1 »
   * afficherait 0 des qu'un autre statut est selectionne.
   */
  counts: TaskCounts
  onSearchChange: (value: string) => void
  onStatusChange: (status: TaskStatus | null) => void
  onCreate: () => void
}

export function TaskFilters({
  search,
  status,
  counts,
  onSearchChange,
  onStatusChange,
  onCreate,
}: TaskFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('task.searchPlaceholder')}
            aria-label={t('common.search')}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </div>
        <Button onClick={onCreate}>
          <Plus size={14} aria-hidden="true" />
          {t('task.newTask')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterTab
          label={`${t('task.filter.all')} · ${counts.all}`}
          active={status === null}
          onClick={() => onStatusChange(null)}
        />
        {TASK_STATUSES.map((candidate) => (
          <FilterTab
            key={candidate}
            label={`${t(`task.statuses.${candidate}`)} · ${counts[candidate]}`}
            active={status === candidate}
            onClick={() => onStatusChange(candidate)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}
