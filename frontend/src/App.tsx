import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/context/AuthProvider'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TasksPage } from '@/pages/TasksPage'
import { GuestRoute, ProtectedRoute } from '@/routes/ProtectedRoute'

function App() {
  const { i18n } = useTranslation()

  // Tient <html lang> a jour : utile aux lecteurs d'ecran et a la cesure.
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'fr'
  }, [i18n.resolvedLanguage])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>

        {/* Les succes passent en toast discret ; warnings et erreurs en SweetAlert. */}
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
