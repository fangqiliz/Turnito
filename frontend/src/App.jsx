import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './context/AuthContext'
import { BusinessProvider } from './context/BusinessContext'

// Shared route guards
import ProtectedRoute         from './components/shared/ProtectedRoute'
import ProtectedAdminRoute    from './components/shared/ProtectedAdminRoute'
import ProtectedEmployeeRoute from './components/shared/ProtectedEmployeeRoute'
import ProtectedClientRoute   from './components/shared/ProtectedClientRoute'
import SmartRedirect          from './components/shared/SmartRedirect'

// Layouts
import AuthLayout       from './components/layout/AuthLayout'
import DashboardLayout  from './components/layout/DashboardLayout'
import ClientLayout     from './components/layout/ClientLayout'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Admin portal pages
import AdminDashboard       from './pages/dashboard/AdminDashboard'
import AppointmentsPage     from './pages/dashboard/AppointmentsPage'
import EmployeesPage        from './pages/dashboard/EmployeesPage'
import ServicesPage         from './pages/dashboard/ServicesPage'
import SchedulesPage        from './pages/dashboard/SchedulesPage'
import BusinessSettingsPage from './pages/dashboard/BusinessSettingsPage'
import BusinessesPage       from './pages/dashboard/BusinessesPage'
import CreateBusinessPage   from './pages/dashboard/CreateBusinessPage'
import ProfilePage          from './pages/dashboard/ProfilePage'

// Employee portal
import EmployeeDashboard from './pages/employee/EmployeeDashboard'

// Client portal
import ClientDashboard    from './pages/client/ClientDashboard'
import MyAppointmentsPage from './pages/client/MyAppointmentsPage'
import ClientBusinessesPage from './pages/client/BusinessesPage'
import BookingPage        from './pages/client/BookingPage'
import UserProfilePage    from './pages/client/ProfilePage'

import NotFoundPage from './pages/NotFoundPage'

function BookRedirect() {
  const { businessSlug } = useParams()
  return <Navigate to={`/client/book/${businessSlug}`} replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
              },
              success: { iconTheme: { primary: 'var(--color-success)', secondary: 'white' } },
              error:   { iconTheme: { primary: 'var(--color-danger)', secondary: 'white' } },
            }}
          />

          <Routes>
            {/* ── Auth (redirect to / if already logged in) ──────────────────── */}
            <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* ── Admin portal (/dashboard) ──────────────────────────────────── */}
            <Route element={<ProtectedAdminRoute><DashboardLayout /></ProtectedAdminRoute>}>
              <Route path="/dashboard"                   element={<AdminDashboard />} />
              <Route path="/dashboard/appointments"      element={<AppointmentsPage />} />
              <Route path="/dashboard/employees"         element={<EmployeesPage />} />
              <Route path="/dashboard/services"          element={<ServicesPage />} />
              <Route path="/dashboard/schedules"         element={<SchedulesPage />} />
              <Route path="/dashboard/businesses"        element={<BusinessesPage />} />
              <Route path="/dashboard/businesses/create" element={<CreateBusinessPage />} />
              <Route path="/dashboard/settings"          element={<BusinessSettingsPage />} />
              <Route path="/dashboard/profile"           element={<ProfilePage />} />
            </Route>

            {/* ── Employee portal (/employee) ────────────────────────────────── */}
            <Route element={<ProtectedEmployeeRoute><ClientLayout /></ProtectedEmployeeRoute>}>
              <Route path="/employee"         element={<EmployeeDashboard />} />
              <Route path="/employee/profile" element={<UserProfilePage />} />
            </Route>

            {/* ── Client portal (/client) ────────────────────────────────────── */}
            <Route element={<ProtectedClientRoute><ClientLayout /></ProtectedClientRoute>}>
              <Route path="/client"                      element={<ClientDashboard />} />
              <Route path="/client/appointments"         element={<MyAppointmentsPage />} />
              <Route path="/client/businesses"           element={<ClientBusinessesPage />} />
              <Route path="/client/book/:businessSlug"   element={<BookingPage />} />
              <Route path="/client/profile"              element={<UserProfilePage />} />
            </Route>

            {/* ── Backward-compat redirects ─────────────────────────────────── */}
            <Route path="/my-appointments"       element={<Navigate to="/client/appointments" replace />} />
            <Route path="/book/:businessSlug"    element={<BookRedirect />} />

            {/* ── Root: smart redirect based on role ───────────────────────── */}
            <Route path="/" element={<SmartRedirect />} />

            {/* ── 404 ───────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
