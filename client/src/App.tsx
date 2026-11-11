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

// Dashboard Shell matching Reference Visual Layout
import { DashboardShell } from './components/dashboard/DashboardShell';

// Toast Icons
import {
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
    notifications,
    dismissNotification,
  } = useApp();

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.basePrice * item.quantity,
    0
  );

  return (
    <DashboardShell
      activeScreen={activeScreen}
      onNavigate={navigateTo}
      cartCount={totalCartCount}
      cartTotal={cartSubtotal}
    >
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 transition-all ${
              n.type === 'success'
                ? 'bg-[#003087] text-white border-blue-400/40 shadow-blue-900/30'
                : n.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30'
                : n.type === 'error'
                ? 'bg-red-600 text-white border-red-500 shadow-red-900/30'
                : 'bg-slate-900 text-white border-slate-700 shadow-slate-900/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />}
              {n.type === 'info' && <Info className="w-4 h-4 text-blue-200 shrink-0" />}
              <span className="leading-snug">{n.message}</span>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="p-1 hover:bg-white/15 rounded-md transition-colors text-white/80 hover:text-white cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Screen Viewport */}
      {activeScreen === 'home' && <HomeScreen />}
      {activeScreen === 'workspace' && <IntentWorkspaceScreen />}
      {activeScreen === 'planning' && <PlanningScreen />}
      {activeScreen === 'discovery' && <DiscoveryScreen />}
      {activeScreen === 'decision' && <DecisionScreen />}
      {activeScreen === 'cart' && <CartScreen />}
      {activeScreen === 'payment' && <PaymentScreen />}
      {activeScreen === 'history' && <HistoryScreen />}
      {activeScreen === 'settings' && <SettingsScreen />}
    </DashboardShell>
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
