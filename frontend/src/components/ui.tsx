import type { ComponentPropsWithRef, ReactNode } from 'react'

/** Petites primitives partagees, pour que boutons et champs restent identiques partout. */

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent/90 focus-visible:ring-accent',
  ghost:
    'border border-line-strong bg-surface text-ink hover:bg-ground focus-visible:ring-line-strong',
  subtle: 'text-muted hover:bg-surface-2 focus-visible:ring-line-strong',
} as const

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: keyof typeof BUTTON_VARIANTS
  block?: boolean
}

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}

const FIELD_BASE =
  'w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  children?: ReactNode
}

/** Enveloppe libelle + champ + message d'erreur, avec le lien aria qui va avec. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-muted">
        {label}
      </label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        ) : (
          <span />
        )}
        {hint ? <p className="mt-1 text-xs tabular-nums text-muted">{hint}</p> : null}
      </div>
    </div>
  )
}

interface TextInputProps extends ComponentPropsWithRef<'input'> {
  invalid?: boolean
}

export function TextInput({ invalid = false, className = '', id, ...props }: TextInputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className={`${FIELD_BASE} ${
        invalid
          ? 'border-danger focus-visible:ring-danger'
          : 'border-line-strong focus-visible:ring-accent'
      } ${className}`}
      {...props}
    />
  )
}

interface TextAreaProps extends ComponentPropsWithRef<'textarea'> {
  invalid?: boolean
}

export function TextArea({ invalid = false, className = '', id, ...props }: TextAreaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className={`${FIELD_BASE} resize-y ${
        invalid
          ? 'border-danger focus-visible:ring-danger'
          : 'border-line-strong focus-visible:ring-accent'
      } ${className}`}
      {...props}
    />
  )
}
