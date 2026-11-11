import type { ScreenId } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Search, Bell, Info, ChevronDown, Sparkles } from 'lucide-react';

export interface DashboardHeaderProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  cartCount?: number;
  cartTotal?: number;
  userName?: string;
  className?: string;
}

export function DashboardHeader({
  activeScreen,
  onNavigate,
  cartCount = 0,
  userName = 'BayFi',
  className,
}: DashboardHeaderProps) {
  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getScreenSubtitle = (screen: ScreenId) => {
    switch (screen) {
      case 'home':
        return 'Stay on top of your shopping intentions with PayPal Intent AI, monitor progress, and track status.';
      case 'workspace':
        return 'Break down your high-level goals into precise, verified hardware and product requirements.';
      case 'planning':
        return 'Fine-tune essential priorities, budget allocations, and category constraints.';
      case 'decision':
        return 'Review AI-optimized bundles, evaluate multi-tier trade-offs, and defend your budget ceiling.';
      case 'discovery':
        return 'Explore catalog products with verified specifications, real ratings, and compatibility.';
      case 'cart':
        return 'Verify staging quantities, tax calculations, and prepare for human-approved checkout.';
      case 'payment':
        return 'Authorize genuine PayPal Sandbox orders with human-in-the-loop explicit approval.';
      case 'history':
        return 'Inspect permanent activity records, digital receipts, and cryptographic audit seals.';
      case 'settings':
        return 'Monitor Ollama AI engine health, SQLite WAL database stats, and Sandbox connectivity.';
      default:
        return 'Intention-driven autonomous commerce orchestrated by local AI.';
    }
  };

  const getScreenTitle = (screen: ScreenId) => {
    switch (screen) {
      case 'home':
        return `${getGreeting()}, ${userName}`;
      case 'workspace':
        return 'Goal Decomposition';
      case 'planning':
        return 'Category Planning';
      case 'decision':
        return 'Optimization Studio';
      case 'discovery':
        return 'Catalog Discovery';
      case 'cart':
        return 'Review Order & Cart';
      case 'payment':
        return 'PayPal Payment Gateway';
      case 'history':
        return 'Activity & History';
      case 'settings':
        return 'Settings & Diagnostics';
      default:
        return 'PayPal Intent';
    }
  };

  return (
    <div className={cn('space-y-4 text-left select-none', className)}>
      {/* Top Utility Strip (Matches Reference Header) */}
      <div className="flex items-center justify-between gap-4">
        {/* Top-Left: Logo Pill */}
        <div
          onClick={() => onNavigate('home')}
          className="px-4 py-2 rounded-full bg-[#0A1629] text-white flex items-center gap-2.5 font-bold text-sm shadow-xs cursor-pointer hover:bg-[#0F1D36] transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-[#0070BA] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="tracking-tight text-white font-extrabold">
            PayPal <span className="text-[#009CDE]">Intent</span>
          </span>
        </div>

        {/* Top-Right: Quick Search Pill & Profile Pill */}
        <div className="flex items-center gap-3">
          {/* Controls Pill: Search, Bell, Info */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-slate-500">
            <button
              onClick={() => onNavigate('discovery')}
              title="Search catalog"
              className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('history')}
              title="Notifications & Activity"
              className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0070BA]" />
              )}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              title="System Diagnostics & Info"
              className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Pill: Green Logo / Avatar + Name + Dropdown */}
          <div
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              B
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#0070BA] transition-colors">
              {userName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Main Page Greeting & Subtitle (Matches Reference Headline) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {getScreenTitle(activeScreen)}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {getScreenSubtitle(activeScreen)}
        </p>
      </div>
    </div>
  );
}
