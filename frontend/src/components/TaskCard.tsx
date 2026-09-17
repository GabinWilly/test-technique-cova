import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/StatusBadge'
import { STATUS_STRIPE } from '@/lib/taskStatus'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { t, i18n } = useTranslation()

  // Intl suit la langue courante : 17/09/2026 en francais, 9/17/2026 en anglais.
  const formatted = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(task.updatedAt))

  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
      <span
        aria-hidden="true"
        className={`w-0.75 self-stretch rounded-sm ${STATUS_STRIPE[task.status]}`}
      />

      <div className="min-w-0 flex-1">
        <h3
          className={`text-sm font-semibold ${
            task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-900'
          }`}
        >
          {task.title}
        </h3>
        {task.description ? (
          <p className="mt-0.5 truncate text-xs text-slate-500">{task.description}</p>
        ) : null}
        <p className="mt-1.5 text-[11px] tabular-nums text-slate-400">
          {t('task.updatedAt', { date: formatted })}
        </p>
      </div>

      <div className="flex flex-none items-center gap-1.5">
        <StatusBadge status={task.status} />
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`${t('common.edit')} — ${task.title}`}
          className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`${t('common.delete')} — ${task.title}`}
          className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
