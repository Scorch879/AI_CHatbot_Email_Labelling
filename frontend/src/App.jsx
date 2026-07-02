import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import InternalMail from './pages/InternalMail'
import Applicants from './pages/Applicants'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './auth/AuthProvider'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute>
                <ResetPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/internal-mail"
            element={
              <ProtectedRoute>
                <InternalMail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/applicants"
            element={
              <ProtectedRoute>
                <Applicants />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

