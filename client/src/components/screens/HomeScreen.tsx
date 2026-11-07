import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

const ARCHETYPES = [
  {
    title: 'Developer Workstation',
    budget: 1500,
    prompt: 'High-performance programming workstation with 4K monitor, mechanical keyboard, and precision mouse under $1500',
    category: 'Workstation',
  },
  {
    title: 'Designer Studio Setup',
    budget: 1200,
    prompt: 'Graphic design workstation with color-accurate display, ergonomic chair, and noise-canceling headphones under $1200',
    category: 'Creative Studio',
  },
  {
    title: 'Ergonomic WFH Office',
    budget: 800,
    prompt: 'Ergonomic home office setup with standing desk, wireless keyboard, and vertical mouse under $800',
    category: 'Ergonomics',
  },
  {
    title: 'Mobile Professional Kit',
    budget: 1800,
    prompt: 'Executive travel productivity bundle with developer laptop, wireless headphones, and compact accessories under $1800',
    category: 'Mobile Office',
  },
];

export function HomeScreen() {
  const { startIntent, navigateTo, isLoading } = useApp();
  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState<string>('350');
  const [urgency, setUrgency] = useState<'standard' | 'high'>('standard');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = prompt.trim();
    if (!trimmed) {
      setValidationError('Please enter a purchasing goal or project description.');
      return;
    }
    if (trimmed.length < 8) {
      setValidationError('Please provide more detail about what you want to achieve (min 8 characters).');
      return;
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setValidationError('Please specify a positive budget ceiling.');
      return;
    }

    await startIntent(trimmed, numBudget, urgency);
  };

  const handleSelectArchetype = (arch: (typeof ARCHETYPES)[0]) => {
    setPrompt(arch.prompt);
    setBudget(arch.budget.toString());
    startIntent(arch.prompt, arch.budget, 'standard');
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0070BA]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Native Agentic Commerce • Independent Hackathon Prototype</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Tell the system what you want. <br />
          <span className="text-[#0070BA]">AI handles the complexity.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Deconstruct high-level purchasing goals into structured product plans, mathematically optimize bundles under hard budget ceilings, and authorize payments via PayPal Sandbox.
        </p>
      </div>

      {/* Central Intent Input Card */}
      <Card className="border-blue-200/80 shadow-md ring-1 ring-blue-500/10">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="intent-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                What purchasing goal do you want to accomplish?
              </label>
              <textarea
                id="intent-input"
                rows={3}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g., Assemble a broadcast-quality podcasting desk setup for 2 people with dynamic mics and headphones under $400..."
                className="w-full bg-slate-50/60 border border-slate-300 rounded-xl p-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />
              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                {/* Budget Input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Hard Ceiling:</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">$</span>
                    <input
                      type="number"
                      min="20"
                      max="10000"
                      step="10"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-7 pr-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Urgency Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Urgency:</span>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium text-slate-700"
                  >
                    <option value="standard">Standard (3-5 Days)</option>
                    <option value="high">Express (1-2 Days)</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                disabled={!prompt.trim()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto bg-[#0070BA] hover:bg-[#005ea6]"
              >
                Analyze & Plan Goal
              </Button>
            </div>
          </form>

          {/* Quick Archetype Suggestion Chips */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <span className="text-xs font-semibold text-slate-500 block mb-2.5">
              Or launch a proven goal archetype:
            </span>
            <div className="flex flex-wrap gap-2">
              {ARCHETYPES.map((arch, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectArchetype(arch)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs font-medium text-slate-700 transition-all text-left"
                >
                  <span className="font-semibold">{arch.title}</span>
                  <span className="text-slate-400 font-mono">(${arch.budget})</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How PayPal Intent Works - 4 Step Progression */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">How PayPal Intent Works</h2>
          <p className="text-xs text-slate-500">Autonomous goal preparation with human-in-the-loop payment governance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-slate-900">State Your Intent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe your objective in plain English with your budget ceiling and key constraints.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-slate-900">AI Goal Planner</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Local Ollama neural models decompose your goal into functional product roles and budget shares.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-slate-900">Knapsack Optimizer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deterministic solver picks compatible items that maximize utility without exceeding budget.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-slate-900">Governed Checkout</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review transparent rationales, customize items, and authorize payment via PayPal Sandbox.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Status Footnote */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Compass className="w-5 h-5 text-[#0070BA]" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-slate-900">Explore Catalog Directly</h4>
            <p className="text-xs text-slate-500">Browse 120+ curated SKUs with side-by-side spec comparison.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => navigateTo('discovery')}>
            Browse Catalog
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateTo('history')}>
            Past Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
