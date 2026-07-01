import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AuthForm = () => {
  // State to toggle between 'login' and 'signup'
  const [isLogin, setIsLogin] = useState(true);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMsg('Logged in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, company },
          },
        });
        if (error) throw error;
        setSuccessMsg('Check your email for the confirmation link.');
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper component for input fields to keep code dry
  const InputField = ({ icon: Icon, type, placeholder, label, value, onChange }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

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
            required
            className="w-full py-2.5 pl-3 pr-10 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          {isPasswordField && (
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9f7f7] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] p-8 border border-gray-100">
        
        {/* Dynamic Header */}
        <div className="mb-8">
          <p className="text-[11px] font-extrabold tracking-wider text-[#046241] uppercase mb-1">
            {isLogin ? 'Welcome back' : 'Start your workspace'}
          </p>
          <h2 className="text-3xl font-extrabold text-[#133020] mb-2">
            {isLogin ? 'Log in to Lifemail' : 'Create your Lifemail account'}
          </h2>
          <p className="text-sm text-gray-600">
            {isLogin 
              ? 'Enter your credentials to continue managing HR email workflows.' 
              : 'Set up secure access for your HR automation workspace.'}
          </p>
        </div>

        {/* Toggle Switch (Pill Style) */}
        <div className="flex bg-[#f5eedb] p-1 rounded-full border border-[#ddd] mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${
              isLogin ? 'bg-[#133020] text-white shadow' : 'text-gray-600 hover:text-[#133020]'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${
              !isLogin ? 'bg-[#133020] text-white shadow' : 'text-gray-600 hover:text-[#133020]'
            }`}
          >
            Sign up
          </button>
        </div>

        {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{errorMsg}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{successMsg}</div>}

        {/* Form Fields */}
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <InputField icon={User} type="text" label="Full name" placeholder="Jane Appleseed" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          )}
          
          <InputField icon={Mail} type="email" label="Work email" placeholder="you@lifemail.app" value={email} onChange={(e) => setEmail(e.target.value)} />
          
          {!isLogin && (
            <InputField icon={Briefcase} type="text" label="Company" placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
          )}
          
          <InputField 
            icon={Lock} 
            type="password" 
            label="Password" 
            placeholder={isLogin ? 'Enter your password' : 'Create a strong password'} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Dynamic Checkbox Row */}
          <div className="flex items-center justify-between mb-8 mt-2 text-sm">
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-[#046241] focus:ring-[#046241] shadow" />
              {isLogin ? 'Remember me' : 'I agree to receive account and workflow notifications from Lifemail.'}
            </label>
            {isLogin && (
              <a href="#" className="font-bold text-[#046241] hover:underline whitespace-nowrap ml-4">
                Forgot password?
              </a>
            )}
          </div>

          {/* Submit Button (Gradient Style) */}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#046241] to-[#ffb347] hover:opacity-90 disabled:opacity-70 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all mb-4 group shadow-md shadow-[#133020]/20">
            <span>{loading ? 'Processing...' : (isLogin ? 'Log in' : 'Create account')}</span>
            {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        {/* Bottom Link */}
        <div className="text-center mt-2 mb-6 text-sm text-gray-700">
          {isLogin ? 'New to Lifemail?' : 'Already have an account?'}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); setSuccessMsg(null); }} 
            className="font-bold text-[#046241] hover:underline whitespace-nowrap ml-1.5"
          >
            {isLogin ? 'Sign up instead' : 'Log in instead'}
          </button>
        </div>

        {/* Protected Workspace Footer */}
        <div className="bg-[#f5eedb] rounded-xl p-4 flex items-start text-sm border border-[#e8dcb8]">
          <ShieldCheck size={22} className="text-[#046241] mr-3 mt-0.5 flex-shrink-0" />
          <span className="text-[#133020] font-medium leading-relaxed">Protected workspace access for HR records and email activity.</span>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;