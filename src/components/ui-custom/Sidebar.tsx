import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Globe,
  Menu,
  X,
} from 'lucide-react';

export function Sidebar() {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/clients', icon: Users, label: t('clients') },
    { path: '/add-client', icon: UserPlus, label: t('addClient') },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'uz' : 'en');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="w-8 h-8 rounded-lg bg-[#1EEBBA] flex items-center justify-center">
          <span className="text-[#0B3A3E] font-bold text-sm">CP</span>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          {t('appName')}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#1EEBBA]/10 text-[#1EEBBA]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-1 border-t border-white/10">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
        >
          <Globe className="w-5 h-5" />
          <span>{language === 'en' ? 'EN / UZ' : 'UZ / EN'}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0B3A3E] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1EEBBA] flex items-center justify-center">
              <span className="text-[#0B3A3E] font-bold text-sm">CP</span>
            </div>
            <span className="text-white font-semibold text-lg">{t('appName')}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="text-white hover:bg-white/10"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="border-t border-white/10 bg-[#0B3A3E]">
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#1EEBBA]/10 text-[#1EEBBA]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="px-3 py-4 space-y-1 border-t border-white/10">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
              >
                <Globe className="w-5 h-5" />
                <span>{language === 'en' ? 'EN / UZ' : 'UZ / EN'}</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0B3A3E] flex-col z-50">
        {sidebarContent}
      </aside>
    </>
  );
}
