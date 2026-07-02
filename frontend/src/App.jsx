import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import InternalMail from './pages/InternalMail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
