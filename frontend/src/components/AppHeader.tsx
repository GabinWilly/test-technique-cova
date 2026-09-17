import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'

export function AppHeader() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?'

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-[15px] font-bold tracking-tight text-slate-900">
          {t('common.appName')}
        </span>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800"
          >
            {initial}
          </span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <LogOut size={14} aria-hidden="true" />
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </header>
  )
}
