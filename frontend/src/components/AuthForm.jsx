import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Helper component for input fields
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

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Transition states for the sleek redirect UI
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');
  
  const navigate = useNavigate();

  // Security Policy: If an authenticated user visits the login page, redirect them automatically
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userMeta = session.user?.user_metadata || {};
        const needsReset = userMeta.force_password_reset === true;
        
        setIsRedirecting(true);
        setRedirectMessage('Active session detected. Redirecting securely...');
        
        setTimeout(() => {
          if (needsReset) {
            navigate('/reset-password');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      
      const userMeta = authData?.user?.user_metadata || {};
      const needsReset = userMeta.force_password_reset === true;

      // Trigger the gorgeous full-screen redirect UI
      setIsRedirecting(true);
      setRedirectMessage(needsReset ? 'Verifying security credentials...' : 'Authenticating your secure workspace...');
      
      setTimeout(() => {
        if (needsReset) {
          navigate('/reset-password');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Auth Error Full Object:', err);
      setError(err.message || 'Invalid login credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  // If redirecting, completely hide the form and show a beautiful loading state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#f5eedb] flex flex-col items-center justify-center p-4 font-sans transition-opacity duration-500">
        <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center justify-center max-w-[400px] w-full border border-gray-100 animate-pulse">
          <Loader2 size={64} className="text-[#046241] animate-spin mb-6" />
          <h2 className="text-2xl font-extrabold text-[#133020] mb-2 text-center">
            Logging in...
          </h2>
          <p className="text-gray-500 text-center font-medium">
            {redirectMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5eedb] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] p-8 border border-gray-100">
        
        <div className="mb-8">
          <img 
            src={logo} 
            alt="Lifemail Logo" 
            className="h-15 w-auto mb-1 object-contain mx-auto block" 
          />
          <h2 className="text-2xl font-extrabold text-[#133020] mb-2 text-center">
            Log in to Lifemail
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Enter your credentials to continue managing HR email workflows.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth}>
          <InputField 
            icon={Mail} 
            type="email" 
            label="Work email" 
            placeholder="you@lifemail.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <InputField 
            icon={Lock} 
            type="password" 
            label="Password" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between mb-8 mt-2 text-sm">
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-[#046241] focus:ring-[#046241] shadow" />
              Remember me
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} className="font-bold text-[#046241] hover:underline whitespace-nowrap ml-4">
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-linear-to-r from-[#046241] to-[#ffb347] hover:opacity-90 disabled:opacity-70 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all mb-6 group shadow-md shadow-[#133020]/20"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="bg-[#f5eedb] rounded-xl p-4 flex items-start text-sm border border-[#e8dcb8]">
          <ShieldCheck size={22} className="text-[#046241] mr-3 mt-0.5 shrink-0" />
          <span className="text-[#133020] font-medium leading-relaxed">Protected workspace access for HR records and email activity.</span>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;