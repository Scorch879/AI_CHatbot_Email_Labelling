import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [needsReset, setNeedsReset] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // First check session, then perform live server validation via getUser() to prevent token tampering/bypass
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session || sessionError) {
        setIsAuthenticated(false);
        setNeedsReset(false);
        return;
      }

      // Live server verification against GoTrue database
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        setIsAuthenticated(false);
        setNeedsReset(false);
        return;
      }

      setIsAuthenticated(true);
      const userMeta = user?.user_metadata || {};
      setNeedsReset(userMeta.force_password_reset === true);
    };

    checkAuth();

    // Listen for auth changes globally
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setNeedsReset(false);
      } else if (session) {
        setIsAuthenticated(true);
        const userMeta = session.user?.user_metadata || {};
        setNeedsReset(userMeta.force_password_reset === true);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Show a premium loading state while we verify the session
  if (isAuthenticated === null || (isAuthenticated === true && needsReset === null)) {
    return (
      <div className="min-h-screen bg-[#f5eedb] flex flex-col items-center justify-center p-4">
        <Loader2 size={48} className="text-[#046241] animate-spin mb-4" />
        <p className="text-[#133020] font-bold text-lg animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  // If not authenticated, kick them back to the login page immediately
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Security Policy: If they need a reset and aren't on the reset page, force them there
  if (needsReset && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  // Security Policy: If they DON'T need a reset and try to access the reset page, block them
  if (!needsReset && location.pathname === '/reset-password') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fully authenticated and compliant. Render the protected component!
  return children;
};

export default ProtectedRoute;
