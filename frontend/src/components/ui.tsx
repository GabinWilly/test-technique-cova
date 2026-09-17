import type { ComponentPropsWithRef, ReactNode } from 'react'

/** Petites primitives partagees, pour que boutons et champs restent identiques partout. */

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

const BUTTON_VARIANTS = {
  primary: 'bg-teal-800 text-white hover:bg-teal-900 focus-visible:ring-teal-700',
  ghost:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  subtle: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
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
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

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
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-700">
            {error}
          </p>
        ) : (
          <span />
        )}
        {hint ? <p className="mt-1 text-xs tabular-nums text-slate-400">{hint}</p> : null}
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
          ? 'border-red-600 focus-visible:ring-red-600'
          : 'border-slate-300 focus-visible:ring-teal-700'
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
          ? 'border-red-600 focus-visible:ring-red-600'
          : 'border-slate-300 focus-visible:ring-teal-700'
      } ${className}`}
      {...props}
    />
  )
}
