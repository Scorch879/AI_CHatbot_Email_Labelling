import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid2X2, 
  Inbox, 
  Users, 
  BriefcaseBusiness, 
  Settings, 
  Lock, 
  Menu, 
  X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import logoImg from '../assets/logo.jpg';

const navItems = [
  { label: 'Dashboard', icon: Grid2X2, path: '/dashboard' },
  { label: 'Internal Mail', icon: Inbox, path: '/dashboard/internal-mail' },
  { label: 'Applicants', icon: Users, path: '/dashboard' },
  { label: 'Reports', icon: BriefcaseBusiness, path: '/dashboard' },
  { label: 'Settings', icon: Settings, path: '/dashboard' },
];

export default function Sidebar({ activeTab }) {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between bg-white dark:bg-[#133020] border-b border-gray-200 dark:border-white/10 p-4 sticky top-0 z-40">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            onError={(e) => { e.target.src = logoImg; }} 
            alt="Lifemail Logo" 
            className="h-9 w-auto object-contain" 
          />
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          type="button"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 self-start
        bg-white dark:bg-[#133020] border-r border-gray-200 dark:border-white/10 
        flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Brand Logo Header */}
          <div className="flex h-16 items-center px-6 border-b border-gray-100 dark:border-white/10">
            <img 
              src="/logo.png" 
              onError={(e) => { e.target.src = logoImg; }} 
              alt="Lifemail Logo" 
              className="h-10 w-auto object-contain" 
            />
          </div>

          {/* Navigation Items */}
          <nav className="grid gap-1.5 p-4">
            {navItems.map(({ label, icon: Icon, path }) => {
              const isActive = activeTab === label;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setIsMobileOpen(false);
                    if (path) navigate(path);
                  }}
                  className={`flex h-11 items-center gap-3.5 rounded-xl px-4 text-left text-sm font-bold transition-all shadow-xs cursor-pointer ${
                    isActive 
                      ? 'bg-[#046241] text-white shadow-md shadow-[#046241]/20 dark:bg-[#046241] dark:text-white ring-1 ring-[#FFC370]/30' 
                      : 'text-[#133020]/70 dark:text-white/70 hover:bg-[#f5eedb]/60 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white'
                  }`}
                  type="button"
                >
                  <Icon size={18} className={isActive ? 'text-[#FFC370]' : 'opacity-70'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Settings Footer */}
        <div className="mt-auto p-4 border-t border-gray-100 dark:border-white/10 bg-[#F9F7F7] dark:bg-[#133020] shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* User Profile Info */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 place-items-center rounded-full bg-[#046241] text-xs font-black text-white ring-2 ring-[#FFC370]/50 shadow-sm shrink-0">
                LM
              </span>
              <span className="min-w-0 overflow-hidden">
                <strong className="block text-xs font-bold text-[#133020] dark:text-white truncate">
                  Linda Martinez
                </strong>
                <small className="block text-[11px] font-medium text-gray-500 dark:text-white/60 truncate">
                  HR Director
                </small>
              </span>
            </div>

            {/* Sign Out Icon Button with Tooltip */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-[#133020]/70 dark:text-white/70 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer shrink-0 relative group"
              type="button"
            >
              <Lock size={16} />
              <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-lg bg-[#133020] dark:bg-black px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 z-50">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
