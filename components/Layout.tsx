import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  User,
  Menu,
  X,
  Shield,
  LogOut
} from 'lucide-react';
import FloatingAssistant from './FloatingAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Chat Rooms', path: '/chat', icon: MessageSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-dark text-slate-200 font-sans selection:bg-brand-gold/20">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-gold" />
            <span className="font-bold text-lg tracking-tight text-white">FS&S</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-white/5">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark/95 border-r border-white/5 transform transition-transform duration-300 ease-in-out backdrop-blur-xl
          lg:relative lg:translate-x-0 flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
                <Shield className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
                <h1 className="font-bold text-white leading-tight">Fire Sword</h1>
                <p className="text-xs text-slate-500">& Shield</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive(item.path) 
                    ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/20 shadow-[0_0_15px_rgba(30,58,138,0.3)]' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-brand-blue' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive(item.path) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(30,58,138,0.8)]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-xl p-3 border border-white/5 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                   {user.avatar_url ? (
                       <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                           {user.username.charAt(0).toUpperCase()}
                       </div>
                   )}
               </div>
               <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                   <p className="text-xs text-brand-green truncate">Online</p>
               </div>
            </div>

            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2 text-sm text-slate-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-blue/10 via-brand-dark to-brand-dark">
          <div className="min-h-full p-4 lg:p-8 pb-24">
            {children}
          </div>
        </main>

        <FloatingAssistant />
      </div>
    </div>
  );
};

export default Layout;