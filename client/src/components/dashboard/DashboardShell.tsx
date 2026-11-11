import React from 'react';
import type { ScreenId } from '../../context/AppContext';
import { SidebarNavigation } from './SidebarNavigation';
import { DashboardHeader } from './DashboardHeader';
import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';

export interface DashboardShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  cartCount?: number;
  cartTotal?: number;
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  activeScreen,
  onNavigate,
  cartCount = 0,
  cartTotal = 0,
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#060D25] bg-[radial-gradient(ellipse_90%_80%_at_50%_-20%,rgba(14,36,99,0.6),rgba(6,13,37,1))] p-3 sm:p-5 lg:p-7 flex items-center justify-center font-sans antialiased text-slate-900 selection:bg-[#0070BA] selection:text-white">
      {/* Centered Master Dashboard Canvas (Matches Reference Image) */}
      <div className="max-w-[1440px] w-full min-h-[900px] bg-[#F2F4F8] rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 p-4 sm:p-6 lg:p-7 flex flex-col lg:flex-row gap-5 lg:gap-7 relative overflow-hidden">
        {/* Left Navigation Rail (Inside the Canvas) */}
        <aside className="hidden lg:flex flex-col items-center justify-between w-16 shrink-0 py-2 select-none">
          {/* Top Branding Emblem */}
          <div className="space-y-6 flex flex-col items-center">
            <button
              onClick={() => onNavigate('home')}
              className="w-12 h-12 rounded-2xl bg-[#0A1629] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer focus-ring"
              title="PayPal Intent"
            >
              <div className="flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#009CDE]" />
              </div>
            </button>

            {/* Vertical Icon Rail */}
            <SidebarNavigation
              activeScreen={activeScreen}
              onNavigate={onNavigate}
              cartCount={cartCount}
            />
          </div>
        </aside>

        {/* Mobile Top Header (on mobile viewport) */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0A1629] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#009CDE]" />
            </div>
            <span className="font-bold text-base text-slate-900">
              PayPal <span className="text-[#0070BA]">Intent</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Sandbox
            </span>
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-full bg-white border border-slate-200 text-slate-700"
            >
              <span className="text-xs font-bold font-mono">{cartCount}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className={cn('flex-1 flex flex-col min-w-0 space-y-5', className)}>
          {/* Top Header Inside Canvas */}
          <DashboardHeader
            activeScreen={activeScreen}
            onNavigate={onNavigate}
            cartCount={cartCount}
            cartTotal={cartTotal}
          />

          {/* Screen Content Viewport */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Rail */}
      <SidebarNavigation
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        cartCount={cartCount}
        className="lg:hidden"
      />
    </div>
  );
}
