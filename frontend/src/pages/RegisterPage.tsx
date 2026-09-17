import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, Field, TextInput } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { reportError } from '@/lib/alerts'
import { PASSWORD_MIN_LENGTH } from '@/types'

export function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    try {
      await register(name, email, password)
      navigate('/tasks', { replace: true })
    } catch (error) {
      const failure = reportError(error)
      setFieldErrors(failure.fieldErrors ?? {})
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {t('auth.registerTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Field id="register-name" label={t('auth.name')} error={fieldErrors.name}>
              <TextInput
                id="register-name"
                value={name}
                autoComplete="name"
                required
                placeholder={t('auth.namePlaceholder')}
                invalid={Boolean(fieldErrors.name)}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

            <Field id="register-email" label={t('auth.email')} error={fieldErrors.email}>
              <TextInput
                id="register-email"
                type="email"
                value={email}
                autoComplete="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                invalid={Boolean(fieldErrors.email)}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field id="register-password" label={t('auth.password')} error={fieldErrors.password}>
              <TextInput
                id="register-password"
                type="password"
                value={password}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                invalid={Boolean(fieldErrors.password)}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Button type="submit" block disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('auth.submitRegister')}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t('auth.haveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-teal-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
