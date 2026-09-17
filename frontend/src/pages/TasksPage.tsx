import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { TaskCard } from '@/components/TaskCard'
import { TaskFilters, type TaskCounts } from '@/components/TaskFilters'
import { TaskFormModal } from '@/components/TaskFormModal'
import { api } from '@/lib/api'
import { confirmDelete, reportError } from '@/lib/alerts'
import type { Task, TaskPayload, TaskStatus } from '@/types'

const EMPTY_COUNTS: TaskCounts = { all: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 }

function countBy(tasks: Task[]): TaskCounts {
  return tasks.reduce<TaskCounts>(
    (acc, task) => ({ ...acc, all: acc.all + 1, [task.status]: acc[task.status] + 1 }),
    { ...EMPTY_COUNTS },
  )
}

export function TasksPage() {
  const { t } = useTranslation()

  const [tasks, setTasks] = useState<Task[]>([])
  const [counts, setCounts] = useState<TaskCounts>(EMPTY_COUNTS)
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | null>(null)

  const [editing, setEditing] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // La frappe ne doit pas declencher une requete par caractere.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  /** Liste non filtree, uniquement pour les compteurs d'onglets. */
  const refreshCounts = useCallback(async () => {
    try {
      const { data } = await api.get<Task[]>('/tasks')
      setCounts(countBy(data))
    } catch {
      /* les compteurs sont secondaires : leur echec ne doit pas alerter */
    }
  }, [])

  // Chaque frappe ou changement de filtre relance une requete ; sans garde,
  // une reponse lente pourrait ecraser une reponse plus recente.
  const requestId = useRef(0)

  const loadTasks = useCallback(async () => {
    const current = ++requestId.current
    setIsLoading(true)
    try {
      const { data } = await api.get<Task[]>('/tasks', {
        params: {
          status: status ?? undefined,
          search: debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim(),
        },
      })
      if (current === requestId.current) setTasks(data)
    } catch (error) {
      if (current === requestId.current) reportError(error)
    } finally {
      if (current === requestId.current) setIsLoading(false)
    }
  }, [status, debouncedSearch])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  const hasFilters = status !== null || debouncedSearch.trim() !== ''

  function openCreate() {
    setEditing(null)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setFieldErrors({})
    setIsModalOpen(true)
  }

  async function handleSubmit(payload: TaskPayload) {
    setIsSaving(true)
    setFieldErrors({})
    try {
      if (editing) {
        await api.put<Task>(`/tasks/${editing.id}`, payload)
        toast.success(t('success.taskUpdated'))
      } else {
        await api.post<Task>('/tasks', payload)
        toast.success(t('success.taskCreated'))
      }
      setIsModalOpen(false)
      await Promise.all([loadTasks(), refreshCounts()])
    } catch (error) {
      const failure = reportError(error)
      setFieldErrors(failure.fieldErrors ?? {})
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = await confirmDelete(task.title)
    if (!confirmed) return

    // Suppression optimiste : la carte part tout de suite, et revient si le
    // serveur refuse.
    const previous = tasks
    setTasks((current) => current.filter((item) => item.id !== task.id))
    try {
      await api.delete(`/tasks/${task.id}`)
      toast.success(t('success.taskDeleted'))
      await refreshCounts()
    } catch (error) {
      setTasks(previous)
      reportError(error)
    }
  }

  function renderContent() {
    if (isLoading && tasks.length === 0) {
      // Trois cartes fantomes a la hauteur des vraies : pas de saut de mise en page.
      return (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label={t('common.loading')}>
          {[0, 1, 2].map((key) => (
            <li key={key} className="h-21.5 animate-pulse rounded-lg bg-slate-200/70" />
          ))}
        </ul>
      )
    }

    if (tasks.length === 0) {
      return (
        <EmptyState
          variant={hasFilters ? 'no-results' : 'no-tasks'}
          onCreate={openCreate}
          onClearFilters={() => {
            setSearch('')
            setDebouncedSearch('')
            setStatus(null)
          }}
        />
      )
    }

    return (
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={handleDelete} />
        ))}
      </ul>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {t('task.myTasks')}
          </h1>
          <p className="text-xs text-slate-500">{t('task.count', { count: counts.all })}</p>
        </div>

        <TaskFilters
          search={search}
          status={status}
          counts={counts}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onCreate={openCreate}
        />

        {renderContent()}
      </main>

      {isModalOpen ? (
        <TaskFormModal
          task={editing}
          isSaving={isSaving}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </div>
  )
}
