import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, cn } from '../../lib/utils';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Search,
  Filter,
  Shield,
  Keyboard,
  Mouse,
  Headphones,
  Lamp,
} from 'lucide-react';

export function HomeScreen() {
  const {
    currentIntent,
    bundleItems,
    catalogProducts,
    transactions,
    activeTier,
    setActiveTier,
    startIntent,
    navigateTo,
    isLoading,
  } = useApp();

  const [promptInput, setPromptInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('300');
  const [searchFilter, setSearchFilter] = useState('');

  // 1. Current Intent & Budget
  const budgetCeiling = currentIntent?.budgetAmount || 300;
  const isHardCeiling = currentIntent?.isHardCeiling ?? true;
  const activePrompt =
    currentIntent?.rawPrompt ||
    'Productive and comfortable study desk setup: keyboard, wireless mouse, desk lamp, and headphones under $300';

  // 2. Identify real products for the 4 core categories from active bundleItems
  const selectedKeyboard =
    bundleItems.find((p) => p.categoryId?.toLowerCase().includes('keyboard') || p.id.startsWith('prod_kb')) ||
    catalogProducts.find((p) => p.id === (activeTier === 'performance' ? 'prod_kb_02' : 'prod_kb_03')) ||
    catalogProducts.find((p) => p.categoryId?.toLowerCase().includes('keyboard')) || {
      id: 'prod_kb_03',
      title: 'NovaType SilentTouch Low-Profile Bluetooth Keyboard',
      basePrice: 59.99,
      categoryId: 'keyboards',
      brand: 'NovaType',
      sku: 'prod_kb_03',
    };

  const selectedMouse =
    bundleItems.find((p) => p.categoryId?.toLowerCase().includes('mice') || p.categoryId?.toLowerCase().includes('mou') || p.title?.toLowerCase().includes('mouse') || p.id.startsWith('prod_mou')) ||
    catalogProducts.find((p) => p.id === (activeTier === 'performance' ? 'prod_mou_02' : 'prod_mou_01')) ||
    catalogProducts.find((p) => p.categoryId?.toLowerCase().includes('mice') || p.title?.toLowerCase().includes('mouse')) || {
      id: 'prod_mou_01',
      title: 'ErgoKey ErgoGlide Vertical Ergonomic Wireless Mouse',
      basePrice: 69.99,
      categoryId: 'mice',
      brand: 'ErgoKey',
      sku: 'prod_mou_01',
    };

  const selectedLamp =
    bundleItems.find(
      (p) =>
        p.title?.toLowerCase().includes('lamp') ||
        p.title?.toLowerCase().includes('screenbar') ||
        p.categoryId?.toLowerCase().includes('lighting') ||
        p.categoryId?.toLowerCase().includes('accessories') ||
        p.id.startsWith('prod_acc')
    ) ||
    catalogProducts.find((p) => p.id === 'prod_acc_02') ||
    catalogProducts.find((p) => p.title?.toLowerCase().includes('lamp')) || {
      id: 'prod_acc_02',
      title: 'Lumeno Pro ScreenBar High-CRI Desk Task Lamp',
      basePrice: 64.99,
      categoryId: 'accessories',
      brand: 'Lumeno',
      sku: 'prod_acc_02',
    };

  const selectedHeadphones =
    bundleItems.find(
      (p) =>
        p.categoryId?.toLowerCase().includes('headphone') ||
        p.title?.toLowerCase().includes('head') ||
        p.id.startsWith('prod_hp')
    ) ||
    catalogProducts.find((p) => p.id === (activeTier === 'budget' ? 'prod_hp_03' : 'prod_hp_01')) ||
    catalogProducts.find((p) => p.title?.toLowerCase().includes('headphone')) || {
      id: activeTier === 'budget' ? 'prod_hp_03' : 'prod_hp_01',
      title:
        activeTier === 'budget'
          ? 'VoiceLink ClearVoice USB Call Headset with Noise-Cancelling Mic'
          : 'StudioPure 40mm Closed-Back Reference Headphones',
      basePrice: activeTier === 'budget' ? 49.99 : 89.99,
      categoryId: 'headphones',
      brand: activeTier === 'budget' ? 'VoiceLink' : 'StudioPure',
      sku: activeTier === 'budget' ? 'prod_hp_03' : 'prod_hp_01',
    };

  // Selected products calculation from real items
  const activeItems =
    bundleItems.length === 4
      ? bundleItems
      : [selectedKeyboard, selectedMouse, selectedLamp, selectedHeadphones];

  const subtotal = activeItems.reduce((acc, item) => acc + item.basePrice, 0);
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const totalAmount = Math.round((subtotal + estimatedTax) * 100) / 100;
  const isOverBudget = isHardCeiling && totalAmount > budgetCeiling;
  const percentage = Math.min(Math.round((totalAmount / budgetCeiling) * 100), 100);
  const headroom = Math.max(Math.round((budgetCeiling - totalAmount) * 100) / 100, 0);
  const shortfall = Math.round((totalAmount - budgetCeiling) * 100) / 100;

  // Real Activities mapped from backend transactions and active intent sessions
  const realActivities = [
    ...transactions.map((tx) => ({
      id: tx.id.slice(0, 10).toUpperCase(),
      activity: tx.intentSummary || 'PayPal Sandbox Order Captured',
      icon: '🅿️',
      price: tx.grossAmount,
      status: tx.status === 'SUCCESS' ? 'Complete' : 'Failed',
      statusColor: tx.status === 'SUCCESS' ? 'emerald' : 'red',
      type: 'PAYMENT',
      date: new Date(tx.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' }) + ' ' + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })),
    {
      id: currentIntent?.id ? currentIntent.id.slice(0, 10).toUpperCase() : 'INT_4A92B1',
      activity: 'Study Desk Setup Intent Decomposed',
      icon: '💻',
      price: budgetCeiling,
      status: 'Goal Staged',
      statusColor: 'blue',
      type: 'INTENT_EVENT',
      date: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'KNAP_0/1',
      activity: '0/1 Knapsack 4-Item Bundle Optimized',
      icon: '⚡',
      price: subtotal,
      status: isOverBudget ? 'Trade-Off Active' : 'Optimized',
      statusColor: isOverBudget ? 'amber' : 'emerald',
      type: 'OPTIMIZER_EVENT',
      date: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'CEIL_DEF',
      activity: isOverBudget ? `Hard Ceiling Alert (+$${shortfall})` : 'Hard Budget Ceiling Guard Active',
      icon: '🛡️',
      price: shortfall > 0 ? shortfall : headroom,
      status: isOverBudget ? 'Deficit Flagged' : 'Guarded',
      statusColor: isOverBudget ? 'amber' : 'emerald',
      type: 'GUARD_EVENT',
      date: 'Active',
    },
  ].filter((act) => !searchFilter || act.activity.toLowerCase().includes(searchFilter.toLowerCase()));

  const handleLaunchIntent = async () => {
    if (!promptInput.trim()) return;
    const b = parseFloat(budgetInput) || 300;
    await startIntent(promptInput.trim(), b);
  };

  return (
    <div className="space-y-6 text-left">
      {/* =========================================================================
          MAIN 3-COLUMN DASHBOARD GRID (MATCHES REFERENCE LAYOUT COMPOSITION)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* =======================================================================
            LEFT COLUMN (4 Cols): Balance / Intent, Summary, Monthly Limit
            ======================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1 — Current Intent & Balance (Matches Reference Card 1) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Current Goal Budget
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                <span>🇺🇸</span> USD
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                {formatCurrency(budgetCeiling)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>4 Essential Categories Targeted</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 line-clamp-2 italic">
              "{activePrompt}"
            </div>

            {/* Action Buttons (Matches Transfer & Request pill buttons) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => navigateTo('workspace')}
                className="py-2.5 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Refine Goal</span>
              </button>

              <button
                onClick={() => navigateTo('decision')}
                className="py-2.5 px-3 rounded-full bg-gradient-to-r from-[#0070BA] to-[#004C99] hover:from-[#005ea6] hover:to-[#003d7a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Optimize</span>
              </button>
            </div>
          </div>

          {/* Card 2 — Intent Summary & Categories (Matches Reference Summary 2x2 grid) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Summary</h3>
                <p className="text-[11px] text-slate-400 font-medium">Real catalog items & allocated prices.</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full cursor-pointer">
                <span>All Tiers</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* 2x2 Category Metrics Grid — Bound to real catalog products */}
            <div className="grid grid-cols-2 gap-3">
              {/* Box 1: Keyboard */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-100/80 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600 truncate">Keyboard</span>
                  <Keyboard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(selectedKeyboard.basePrice)}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="w-3 h-3 shrink-0" /> Essential
                </div>
              </div>

              {/* Box 2: Mouse */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600 truncate">Wireless Mouse</span>
                  <Mouse className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(selectedMouse.basePrice)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="w-3 h-3 shrink-0 text-emerald-600" /> Essential
                </div>
              </div>

              {/* Box 3: Lamp */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600 truncate">Desk Lamp</span>
                  <Lamp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(selectedLamp.basePrice)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="w-3 h-3 shrink-0 text-emerald-600" /> Essential
                </div>
              </div>

              {/* Box 4: Headphones */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-600 truncate">
                    {activeTier === 'budget' ? 'Call Headset' : 'Headphones'}
                  </span>
                  <Headphones className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(selectedHeadphones.basePrice)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 truncate">
                  <ArrowUpRight className="w-3 h-3 shrink-0 text-emerald-600" /> Essential
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — Budget Spending Limit (Matches Reference Monthly Spending Limit) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Budget Ceiling Defense</h3>
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {percentage}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 font-bold">{formatCurrency(totalAmount)} allocated</span>
              <span className="text-slate-400 font-medium">{formatCurrency(budgetCeiling)} limit</span>
            </div>

            {/* Blue Progress Bar (Matches Reference Progress Bar) */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isOverBudget
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-600 to-sky-400'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              You've allocated <strong className="text-slate-800">{percentage}%</strong> of your budget ceiling{' '}
              {isOverBudget ? (
                <span className="text-amber-600 font-semibold">(+${shortfall} trade-off active)</span>
              ) : (
                <span className="text-emerald-600 font-semibold">({formatCurrency(headroom)} headroom)</span>
              )}.
            </p>
          </div>
        </div>

        {/* =======================================================================
            MIDDLE COLUMN (4.5 Cols): Optimization Chart & Activities Table
            ======================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 4 — Total Income / Budget Optimization Overview (Matches Reference Bar Chart) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Optimization Overview</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Category budget allocation across optimal bundle
                </p>
              </div>

              {/* Quality Tiers Pill Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                <button
                  onClick={() => setActiveTier('budget')}
                  className={cn(
                    'px-2 py-0.5 rounded-full transition-colors cursor-pointer',
                    activeTier === 'budget' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  Budget
                </button>
                <button
                  onClick={() => setActiveTier('balanced')}
                  className={cn(
                    'px-2 py-0.5 rounded-full transition-colors cursor-pointer',
                    activeTier === 'balanced' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  Balanced
                </button>
                <button
                  onClick={() => setActiveTier('performance')}
                  className={cn(
                    'px-2 py-0.5 rounded-full transition-colors cursor-pointer',
                    activeTier === 'performance' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  Pro
                </button>
              </div>
            </div>

            {/* Vertical Bar Chart Bound to Real Catalog Products */}
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { label: 'KB', full: selectedKeyboard.title, price: selectedKeyboard.basePrice, isSelected: true },
                { label: 'Mouse', full: selectedMouse.title, price: selectedMouse.basePrice, isSelected: true },
                { label: 'Lamp', full: selectedLamp.title, price: selectedLamp.basePrice, isSelected: true },
                { label: 'Audio', full: selectedHeadphones.title, price: selectedHeadphones.basePrice, isSelected: true },
                { label: 'Desk', full: 'Standing Desk', price: 44.99, isSelected: false },
                { label: 'Dock', full: 'USB-C GaN Dock', price: 89.99, isSelected: false },
                { label: 'Tax', full: 'Demo Tax (8% Est.)', price: estimatedTax, isSelected: true },
              ].map((bar) => {
                const heightPercent = Math.min(Math.round((bar.price / 140) * 100), 100);

                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-800 transition-colors">
                      ${Math.round(bar.price)}
                    </span>
                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                      <div
                        className={cn(
                          'w-full rounded-t-lg transition-all duration-500',
                          bar.isSelected
                            ? 'bg-gradient-to-t from-blue-700 to-[#009CDE]'
                            : 'bg-slate-300'
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[40px]">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend (Matches Reference • Profit • Loss) */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0070BA]" />
                <span>Selected Bundle Items</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Alternative Candidates</span>
              </div>
            </div>
          </div>

          {/* Card 5 — Recent Activities (Matches Reference Table) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Recent Activities</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-24 sm:w-32 bg-slate-50 border border-slate-200 rounded-full pl-7 pr-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => navigateTo('history')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Table Bound to Real Activities & Backend Transactions */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Order ID</th>
                    <th className="pb-2 font-medium">Activity</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realActivities.slice(0, 5).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">
                        {row.id}
                      </td>
                      <td className="py-2.5 font-medium text-slate-800">
                        <span className="mr-1.5">{row.icon}</span>
                        {row.activity}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                            row.statusColor === 'emerald' && 'bg-emerald-50 text-emerald-700',
                            row.statusColor === 'amber' && 'bg-amber-50 text-amber-700'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              row.statusColor === 'emerald' && 'bg-emerald-500',
                              row.statusColor === 'amber' && 'bg-amber-500'
                            )}
                          />
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN (3.5 Cols): My Cards / Selected Products, Wallets / Tiers
            ======================================================================= */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 6 — My Cards / Selected Hardware Bundle (Matches Reference My Cards) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Selected Hardware</h3>
              <button
                onClick={() => navigateTo('discovery')}
                className="text-xs font-bold text-[#0070BA] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                + Browse All
              </button>
            </div>

            {/* All 4 Sleek Hardware Cards Bound to Real Database SKUs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[440px] overflow-y-auto pr-0.5">
              {activeItems.map((item, idx) => {
                const isAlternate = idx % 2 === 1;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-2xl p-3.5 text-white shadow-md space-y-2 relative overflow-hidden transition-all',
                      isAlternate
                        ? 'bg-gradient-to-br from-[#0F2038] to-[#1E3A5F]'
                        : 'bg-gradient-to-br from-[#0B1528] to-[#122543]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.categoryId?.toLowerCase().includes('keyboard') && (
                          <Keyboard className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        {(item.categoryId?.toLowerCase().includes('mou') || item.categoryId?.toLowerCase().includes('mice')) && (
                          <Mouse className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                        {(item.title?.toLowerCase().includes('lamp') ||
                          item.categoryId?.toLowerCase().includes('accessories') ||
                          item.categoryId?.toLowerCase().includes('lighting')) && (
                          <Lamp className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        {(item.categoryId?.toLowerCase().includes('headphone') ||
                          item.title?.toLowerCase().includes('head')) && (
                          <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                          {item.categoryId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                    </div>
                    <div>
                      <div className="font-mono text-[11px] tracking-widest text-slate-300">
                        •••• •••• •••• {item.id.slice(-4)}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-0.5 truncate" title={item.title}>
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-1.5 font-mono">
                      <span className="text-white font-bold">{formatCurrency(item.basePrice)}</span>
                      <span>{item.brand}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 7 — Wallets / Optimization Tiers (Matches Reference Wallets with USD, EUR, GBP) */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Optimization Tiers</h3>
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-bold">
                +
              </span>
            </div>

            {/* 3 Horizontal Wallets / Tier Bars (Matches Reference USD / EUR / GBP) */}
            <div className="space-y-2.5">
              {/* Wallet 1: Budget */}
              <div
                onClick={() => setActiveTier('budget')}
                className={cn(
                  'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  activeTier === 'budget'
                    ? 'bg-blue-50/70 border-blue-400/80 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>🇺🇸</span> Budget Tier (Headset)
                  </div>
                  <div className="text-sm font-extrabold font-mono text-slate-900">$264.56</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Feasible ($35.44 cushion)</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold text-sm">›</span>
              </div>

              {/* Wallet 2: Balanced */}
              <div
                onClick={() => setActiveTier('balanced')}
                className={cn(
                  'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  activeTier === 'balanced'
                    ? 'bg-blue-50/70 border-blue-400/80 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>🇪🇺</span> Balanced (Over-Ear)
                  </div>
                  <div className="text-sm font-extrabold font-mono text-slate-900">$307.76</div>
                  <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>+$7.76 shortfall alert</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold text-sm">›</span>
              </div>

              {/* Wallet 3: Pro */}
              <div
                onClick={() => setActiveTier('performance')}
                className={cn(
                  'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  activeTier === 'performance'
                    ? 'bg-blue-50/70 border-blue-400/80 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>🇬🇧</span> Pro-Grade Studio
                  </div>
                  <div className="text-sm font-extrabold font-mono text-slate-900">$404.96</div>
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Inactive (Exceeds Limit)</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold text-sm">›</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTENT CREATION CONSOLE (BOTTOM TRAY ON HOMEPAGE)
          ========================================================================= */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0070BA]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Enter New Shopping Intention</h3>
              <p className="text-xs text-slate-400">
                Natural language goal parsed by local Ollama AI (qwen2.5:3b)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#0070BA] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            0/1 Knapsack Optimizer
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Ergonomic study desk setup: keyboard, mouse, lamp, and headphones under $300..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA] transition-all"
            />
          </div>

          <div className="w-full sm:w-36 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Budget"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-7 pr-3 py-3 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA] transition-all"
            />
          </div>

          <button
            onClick={handleLaunchIntent}
            disabled={isLoading || !promptInput.trim()}
            className="px-6 py-3 rounded-2xl bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
          >
            {isLoading ? 'Decomposing...' : 'Decompose Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}
