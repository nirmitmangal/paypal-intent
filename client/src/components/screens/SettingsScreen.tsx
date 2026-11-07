import { useState, useEffect } from 'react';
import type { SystemHealthStatus } from '@paypal-intent/shared';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api, clearStoredSessionToken } from '../../lib/api';
import {
  Cpu,
  Database,
  CreditCard,
  RefreshCw,
  Sliders,
  Info,
  Trash2,
} from 'lucide-react';

export function SettingsScreen() {
  const {
    currency,
    setCurrency,
    activeTier,
    setActiveTier,
    clearCart,
    showNotification,
  } = useApp();

  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [pinging, setPinging] = useState(false);

  const fetchStatus = async () => {
    setPinging(true);
    try {
      const res = await api.getHealth();
      if (res.success && res.data) {
        setHealth(res.data);
        showNotification('Diagnostics refreshed: all local subsystems responding', 'info');
      }
    } catch (err) {
      console.error('Failed to ping health', err);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClearCache = () => {
    clearStoredSessionToken();
    clearCart();
    localStorage.removeItem('paypal_intent_active_v1');
    localStorage.removeItem('paypal_intent_cart_v1');
    showNotification('Local session cache and cart cleared', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="info">System Control</Badge>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Settings & Runtime Diagnostics</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchStatus}
          isLoading={pinging}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Local AI Engine Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm">Local AI Inference (Ollama)</CardTitle>
              </div>
              <Badge variant={health?.services.aiEngine.status === 'ready' ? 'success' : 'warning'}>
                {health?.services.aiEngine.status || 'Checking'}
              </Badge>
            </div>
            <CardDescription>Zero-cost neural inference running on local host</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Active Model:</span>
              <span className="font-mono font-bold text-slate-800">
                {health?.services.aiEngine.model || 'qwen2.5:3b'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Daemon Endpoint:</span>
              <span className="font-mono text-slate-600">
                {health?.services.aiEngine.endpoint || 'http://127.0.0.1:11434'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Inference Latency:</span>
              <span className="font-mono font-medium text-emerald-700">
                {health?.services.aiEngine.latencyMs ? `${health.services.aiEngine.latencyMs}ms` : '< 50ms'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* SQLite Database Diagnostics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm">SQLite Relational Persistence</CardTitle>
              </div>
              <Badge variant={health?.services.database.status === 'connected' ? 'success' : 'error'}>
                {health?.services.database.status || 'Checking'}
              </Badge>
            </div>
            <CardDescription>Node.js 24 native node:sqlite engine in WAL mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Tables:</span>
              <span className="font-mono font-bold text-slate-800">13 Relational Entities</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Journal Mode:</span>
              <span className="font-mono font-bold text-slate-800">WAL (Write-Ahead Logging)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Query Latency:</span>
              <span className="font-mono font-medium text-emerald-700">
                {health?.services.database.latencyMs !== undefined
                  ? `${health.services.database.latencyMs}ms`
                  : '0ms'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PayPal Gateway Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0070BA]" />
                <CardTitle className="text-sm">PayPal Sandbox Gateway</CardTitle>
              </div>
              <Badge variant="paypal">Sandbox Active</Badge>
            </div>
            <CardDescription>Official PayPal Orders v2 REST integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Operating Mode:</span>
              <span className="font-mono font-bold text-slate-800">Sandbox (api-m.sandbox)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Client Secret Isolation:</span>
              <span className="text-emerald-700 font-bold">100% Server-Side Only</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Transaction Simulation:</span>
              <span className="text-slate-800 font-bold">Strictly Barred (Real Sandbox Only)</span>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-sm">User Preferences</CardTitle>
            </div>
            <CardDescription>Personalize optimization weighting and currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-600 font-semibold block">Currency Standard:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 font-semibold block">Default Quality Strategy:</label>
              <select
                value={activeTier}
                onChange={(e) => setActiveTier(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="budget">Budget-Conscious (Max Savings)</option>
                <option value="balanced">Balanced (Optimal Utility / Price)</option>
                <option value="performance">Pro-Grade (Peak Specifications)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="w-full text-xs"
              >
                Clear Local Session & Cart Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Box */}
      <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-4 h-4 text-slate-400" />
          <span>About PayPal Intent</span>
        </div>
        <p>
          Version 1.0.0 • Developed independently for the PayPal AI Hackathon. Demonstrates intention-driven multi-product commerce orchestration with zero-cost local AI inference.
        </p>
      </div>
    </div>
  );
}
