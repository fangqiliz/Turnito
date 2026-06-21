import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './context/AuthContext'
import { BusinessProvider } from './context/BusinessContext'
import ProtectedRoute from './components/shared/ProtectedRoute'

import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import OverviewPage from './pages/dashboard/OverviewPage'
import AppointmentsPage from './pages/dashboard/AppointmentsPage'
import EmployeesPage from './pages/dashboard/EmployeesPage'
import ServicesPage from './pages/dashboard/ServicesPage'
import SchedulesPage from './pages/dashboard/SchedulesPage'
import BusinessSettingsPage from './pages/dashboard/BusinessSettingsPage'
import BusinessesPage from './pages/dashboard/BusinessesPage'
import CreateBusinessPage from './pages/dashboard/CreateBusinessPage'
import ProfilePage from './pages/dashboard/ProfilePage'

import MyAppointmentsPage from './pages/client/MyAppointmentsPage'
import BookingPage from './pages/client/BookingPage'

import NotFoundPage from './pages/NotFoundPage'

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
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
              success: {
                iconTheme: { primary: 'var(--color-success)', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: 'var(--color-danger)', secondary: 'white' },
              },
            }}
          />

          <Routes>
            {/* Auth routes — redirect to dashboard if already logged in */}
            <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Dashboard routes — protected */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<OverviewPage />} />
              <Route path="/dashboard/appointments" element={<AppointmentsPage />} />
              <Route path="/dashboard/employees" element={<EmployeesPage />} />
              <Route path="/dashboard/services" element={<ServicesPage />} />
              <Route path="/dashboard/schedules" element={<SchedulesPage />} />
              <Route path="/dashboard/businesses" element={<BusinessesPage />} />
              <Route path="/dashboard/businesses/create" element={<CreateBusinessPage />} />
              <Route path="/dashboard/settings" element={<BusinessSettingsPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
            </Route>

            {/* Client routes — protected */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/my-appointments" element={<MyAppointmentsPage />} />
            </Route>

            {/* Booking (protected — needs auth for appointment creation) */}
            <Route path="/book/:businessSlug" element={
              <ProtectedRoute><BookingPage /></ProtectedRoute>
            } />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
