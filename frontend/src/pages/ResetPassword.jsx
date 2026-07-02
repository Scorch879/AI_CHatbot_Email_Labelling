import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const MIN_PASSWORD_LENGTH = 12;

const InputField = ({ icon: Icon, type, placeholder, label, value, onChange, required }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-[#133020] mb-1">{label}</label>
      <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:border-[#046241] focus-within:ring-1 focus-within:ring-[#046241] transition-all bg-white">
        <div className="pl-3 text-gray-500">
          <Icon size={18} />
        </div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full py-2.5 pl-3 pr-10 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);
  const { session, refreshAuth, isConfigured, error: authError } = useAuth();

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => () => window.clearTimeout(redirectTimerRef.current), []);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      setLoading(false);
      return;
    }

    try {
      if (!isConfigured || !supabase) {
        throw new Error(authError || 'Supabase authentication is not configured.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      const { error: resetFlagError } = await supabase.rpc('complete_password_reset');
      if (resetFlagError) throw resetFlagError;

      await supabase.auth.updateUser({
        data: { force_password_reset: false },
      });

      await refreshAuth();
      
      setSuccess(true);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 900);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5eedb] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] p-8 border border-gray-100">
        
        <div className="mb-6">
          <img 
            src={logo} 
            alt="Lifemail Logo" 
            className="h-15 w-auto mb-1 object-contain mx-auto block" 
          />
          <h2 className="text-2xl font-extrabold text-[#133020] mb-2 text-center mt-4">
            Secure Your Account
          </h2>
          <p className="text-sm text-gray-600 text-center">
            For security reasons, you must create a private password before continuing.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-[#046241] text-sm rounded-lg flex items-center">
            <CheckCircle size={18} className="mr-2" />
            Password secured! Redirecting to Dashboard...
          </div>
        )}

        <form onSubmit={handleReset}>
          <InputField 
            icon={Lock} 
            type="password" 
            label="New Password" 
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <InputField 
            icon={Lock} 
            type="password" 
            label="Confirm New Password" 
            placeholder="Type your new password again" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button 
            type="submit" 
            disabled={loading || success}
            className="w-full bg-linear-to-r from-[#046241] to-[#ffb347] hover:opacity-90 disabled:opacity-70 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all mt-6 mb-6 group shadow-md shadow-[#133020]/20"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="bg-[#fef2f2] rounded-xl p-4 flex items-start text-sm border border-[#fecaca]">
          <ShieldAlert size={22} className="text-red-600 mr-3 mt-0.5 shrink-0" />
          <span className="text-red-900 font-medium leading-relaxed">
            Never share your new password with anyone. Your account contains sensitive HR information.
          </span>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
