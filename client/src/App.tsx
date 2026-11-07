import { AppProvider, useApp } from './context/AppContext';

// Reusable Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { IntentWorkspaceScreen } from './components/screens/IntentWorkspaceScreen';
import { PlanningScreen } from './components/screens/PlanningScreen';
import { DiscoveryScreen } from './components/screens/DiscoveryScreen';
import { DecisionScreen } from './components/screens/DecisionScreen';
import { CartScreen } from './components/screens/CartScreen';
import { PaymentScreen } from './components/screens/PaymentScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

// Navigation & Icons
import {
  Sparkles,
  ShoppingBag,
  History,
  Settings as SettingsIcon,
  Compass,
  Layers,
  Home,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

function MainLayout() {
  const {
    activeScreen,
    navigateTo,
    cartItems,
    transactions,
    currentIntent,
    notifications,
    dismissNotification,
  } = useApp();

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border flex items-center justify-between gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200 ${
              n.type === 'success'
                ? 'bg-[#003087] text-white border-blue-400/30'
                : n.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500'
                : n.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />}
              {n.type === 'info' && <Info className="w-4 h-4 text-blue-300 shrink-0" />}
              <span>{n.message}</span>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Top Navigation Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#003087] to-[#0070BA] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#003087]">
                  PayPal <span className="text-[#0070BA]">Intent</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Prototype
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium text-left">AI-Native Agentic Commerce</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => navigateTo('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeScreen === 'home' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {currentIntent && (
              <>
                <button
                  onClick={() => navigateTo('workspace')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeScreen === 'workspace' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Workspace</span>
                </button>
                <button
                  onClick={() => navigateTo('decision')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeScreen === 'decision' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Decision</span>
                </button>
              </>
            )}

            <button
              onClick={() => navigateTo('discovery')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeScreen === 'discovery' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discovery</span>
            </button>

            <button
              onClick={() => navigateTo('cart')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 relative ${
                activeScreen === 'cart' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0070BA] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateTo('history')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeScreen === 'history' ? 'bg-blue-50 text-[#0070BA] font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {transactions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {transactions.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right Status Badge & Settings Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PayPal Sandbox</span>
            </div>

            <button
              onClick={() => navigateTo('settings')}
              className={`p-2 rounded-lg transition-colors border ${
                activeScreen === 'settings'
                  ? 'bg-blue-50 text-[#0070BA] border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
              }`}
              title="Settings & Runtime Diagnostics"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 bg-white text-xs font-semibold">
          <button
            onClick={() => navigateTo('home')}
            className={`p-1.5 ${activeScreen === 'home' ? 'text-[#0070BA] font-bold' : 'text-slate-500'}`}
          >
            Home
          </button>
          {currentIntent && (
            <button
              onClick={() => navigateTo('decision')}
              className={`p-1.5 ${activeScreen === 'decision' ? 'text-[#0070BA] font-bold' : 'text-slate-500'}`}
            >
              Decision
            </button>
          )}
          <button
            onClick={() => navigateTo('discovery')}
            className={`p-1.5 ${activeScreen === 'discovery' ? 'text-[#0070BA] font-bold' : 'text-slate-500'}`}
          >
            Catalog
          </button>
          <button
            onClick={() => navigateTo('cart')}
            className={`p-1.5 relative ${activeScreen === 'cart' ? 'text-[#0070BA] font-bold' : 'text-slate-500'}`}
          >
            Cart ({totalCartCount})
          </button>
          <button
            onClick={() => navigateTo('history')}
            className={`p-1.5 ${activeScreen === 'history' ? 'text-[#0070BA] font-bold' : 'text-slate-500'}`}
          >
            History
          </button>
        </div>
      </header>

      {/* Main Dynamic Workspace Screen Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeScreen === 'home' && <HomeScreen />}
        {activeScreen === 'workspace' && <IntentWorkspaceScreen />}
        {activeScreen === 'planning' && <PlanningScreen />}
        {activeScreen === 'discovery' && <DiscoveryScreen />}
        {activeScreen === 'decision' && <DecisionScreen />}
        {activeScreen === 'cart' && <CartScreen />}
        {activeScreen === 'payment' && <PaymentScreen />}
        {activeScreen === 'history' && <HistoryScreen />}
        {activeScreen === 'settings' && <SettingsScreen />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            PayPal Intent — AI Agentic Commerce • Independent Hackathon Prototype
          </p>
          <p className="text-[11px] text-slate-400">
            Not an official PayPal product. Powered by local Ollama AI inference and PayPal Sandbox.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
