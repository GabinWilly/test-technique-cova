import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, Field, TextInput } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { reportError } from '@/lib/alerts'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    try {
      await login(email, password)
      navigate('/tasks', { replace: true })
    } catch (error) {
      // reportError choisit warning (refus metier) ou error (panne reelle),
      // et se tait quand l'API a renvoye des erreurs par champ.
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
            {t('common.appName')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Field id="login-email" label={t('auth.email')} error={fieldErrors.email}>
              <TextInput
                id="login-email"
                type="email"
                value={email}
                autoComplete="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                invalid={Boolean(fieldErrors.email)}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field id="login-password" label={t('auth.password')} error={fieldErrors.password}>
              <TextInput
                id="login-password"
                type="password"
                value={password}
                autoComplete="current-password"
                required
                invalid={Boolean(fieldErrors.password)}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Button type="submit" block disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('auth.submitLogin')}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="font-medium text-teal-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
