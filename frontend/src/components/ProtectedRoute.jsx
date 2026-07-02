import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { loading, session, needsReset, error, refreshAuth, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5eedb] flex flex-col items-center justify-center p-4">
        <Loader2 size={48} className="text-[#046241] animate-spin mb-4" />
        <p className="text-[#133020] font-bold text-lg animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-[#f5eedb] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={24} />
            <div>
              <h1 className="text-lg font-extrabold text-[#133020]">Access Check Failed</h1>
              <p className="mt-1 text-sm font-medium leading-6 text-gray-600">{error}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={refreshAuth}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#046241] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#133020]"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-[#133020] transition hover:bg-gray-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (needsReset && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  if (!needsReset && location.pathname === '/reset-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
