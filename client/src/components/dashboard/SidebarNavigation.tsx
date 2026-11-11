import { useState } from 'react';
import type { ScreenId } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import {
  LayoutGrid,
  Bot,
  Layers,
  Sparkles,
  Compass,
  ShoppingBag,
  History,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';

export interface SidebarNavigationProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  cartCount?: number;
  className?: string;
}

export function SidebarNavigation({
  activeScreen,
  onNavigate,
  cartCount = 0,
  className,
}: SidebarNavigationProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Map screens to the reference visual iconography
  const navItems: { id: ScreenId; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'home', label: 'Dashboard Home', icon: LayoutGrid },
    { id: 'workspace', label: 'AI Goal Decomposition', icon: Bot },
    { id: 'planning', label: 'Category Planning', icon: Layers },
    { id: 'decision', label: 'Optimization Studio', icon: Sparkles },
    { id: 'discovery', label: 'Catalog Discovery', icon: Compass },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingBag },
    { id: 'history', label: 'Activity & Receipts', icon: History },
  ];

  return (
    <>
      {/* Desktop Vertical Strip */}
      <div className={cn('hidden lg:flex flex-col items-center justify-between h-full select-none', className)}>
        {/* Top Controls: Sun/Moon Theme Toggle & Primary Nav Stack */}
        <div className="flex flex-col items-center space-y-4">
          {/* Subtle Theme Icons (matching reference) */}
          <div className="flex flex-col items-center gap-1.5 p-1 bg-white/70 rounded-full border border-slate-200/60 shadow-2xs">
            <button
              onClick={() => setIsDarkMode(false)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer',
                !isDarkMode ? 'bg-[#0A1629] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Light theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer',
                isDarkMode ? 'bg-[#0A1629] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Dark theme"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Main Navigation Stack */}
          <nav className="flex flex-col items-center gap-2 pt-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeScreen === id;
              const isCart = id === 'cart';

              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  title={label}
                  aria-label={label}
                  className={cn(
                    'relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus-ring',
                    isActive
                      ? 'bg-[#0A1629] text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-white/80'
                  )}
                >
                  <Icon className="w-5 h-5" />

                  {/* Cart Count Badge */}
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0070BA] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Stack: Settings, Help, Reset */}
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200/70">
          <button
            onClick={() => onNavigate('settings')}
            title="Settings & System Diagnostics"
            aria-label="Settings"
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus-ring',
              activeScreen === 'settings'
                ? 'bg-[#0A1629] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-800 hover:bg-white/80'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('paypal_intent_active_v1');
              localStorage.removeItem('paypal_intent_cart_v1');
              window.location.reload();
            }}
            title="Reset Intent Session"
            aria-label="Reset Session"
            className="w-10 h-10 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/nirmit2004/paypal-intent"
            target="_blank"
            rel="noreferrer"
            title="Documentation & Guides"
            className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-white/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 shadow-2xl flex items-center justify-around">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeScreen === id;
          const isCart = id === 'cart';

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-label={label}
              className={cn(
                'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer',
                isActive
                  ? 'bg-[#0A1629] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {isCart && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0070BA] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => onNavigate('settings')}
          aria-label="Settings"
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer',
            activeScreen === 'settings'
              ? 'bg-[#0A1629] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-700'
          )}
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>
    </>
  );
}
