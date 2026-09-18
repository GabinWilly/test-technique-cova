import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Field, TextArea, TextInput } from '@/components/ui'
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  type Task,
  type TaskPayload,
  type TaskStatus,
} from '@/types'

interface TaskFormModalProps {
  /** null = creation ; une tache = edition. */
  task: Task | null
  isSaving: boolean
  fieldErrors: Record<string, string>
  onSubmit: (payload: TaskPayload) => void
  onClose: () => void
}

export function TaskFormModal({
  task,
  isSaving,
  fieldErrors,
  onSubmit,
  onClose,
}: TaskFormModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO')

  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  // Echap ferme la modale, comme le clic sur le fond.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim() === '' ? null : description.trim(),
      status,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-heading`}
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={`${formId}-heading`} className="text-base font-semibold text-ink">
            {task ? t('task.editTask') : t('task.newTask')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-7 w-7 place-items-center rounded-md border border-line-strong text-muted hover:bg-ground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field
            id={`${formId}-title`}
            label={t('task.title')}
            error={fieldErrors.title}
            hint={`${title.length} / ${TITLE_MAX_LENGTH}`}
          >
            <TextInput
              ref={titleInputRef}
              id={`${formId}-title`}
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              required
              placeholder={t('task.titlePlaceholder')}
              invalid={Boolean(fieldErrors.title)}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <Field
            id={`${formId}-description`}
            label={t('task.description')}
            error={fieldErrors.description}
            hint={`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}
          >
            <TextArea
              id={`${formId}-description`}
              value={description}
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder={t('task.descriptionPlaceholder')}
              invalid={Boolean(fieldErrors.description)}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-muted">
              {t('task.status')}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {TASK_STATUSES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  aria-pressed={status === candidate}
                  onClick={() => setStatus(candidate)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    status === candidate
                      ? 'border-ink bg-ink text-accent-ink'
                      : 'border-line-strong bg-surface text-muted hover:bg-ground'
                  }`}
                >
                  {t(`task.statuses.${candidate}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || title.trim() === ''}>
              {isSaving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
