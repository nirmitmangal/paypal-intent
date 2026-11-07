import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Send,
  PlusCircle,
} from 'lucide-react';

export function IntentWorkspaceScreen() {
  const { currentIntent, refineIntent, executionPlan, generatePlan, activeTier, navigateTo, isLoading } = useApp();
  const [refinementInput, setRefinementInput] = useState('');

  if (!currentIntent) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-slate-500 text-sm">No active intent session. Please describe your goal on Home.</p>
        <Button onClick={() => navigateTo('home')}>Go to Home</Button>
      </div>
    );
  }

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementInput.trim()) return;
    await refineIntent(refinementInput.trim());
    setRefinementInput('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="info">Intent Workspace</Badge>
          <span className="text-xs text-slate-400 font-mono">ID: {currentIntent.id}</span>
        </div>
        <Badge variant="success">
          <CheckCircle2 className="w-3 h-3" />
          <span>Intent Analyzed</span>
        </Badge>
      </div>

      {/* Main Intent Overview Card */}
      <Card>
        <CardHeader className="bg-slate-50/60 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                User Goal Ingestion
              </span>
              <CardTitle className="mt-1 text-xl">{currentIntent.parsedObjective || 'Active Goal'}</CardTitle>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block">Stated Budget Ceiling</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(currentIntent.budgetAmount, currentIntent.budgetCurrency)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Verbatim Prompt Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-left">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Current Goal Definition:</span>
            <p className="text-sm text-slate-800 font-medium italic">"{currentIntent.rawPrompt}"</p>
          </div>

          {/* Conversational Refinement Input */}
          <form onSubmit={handleRefine} className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="refine-input" className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Refine or add constraints (e.g., "Must be USB-C", "Cap budget at $300"):</span>
              </label>
            </div>

            <div className="flex gap-2">
              <input
                id="refine-input"
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="Type an adjustment, additional preference, or constraint..."
                className="flex-1 bg-white border border-blue-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <Button
                type="submit"
                size="sm"
                isLoading={isLoading}
                disabled={!refinementInput.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Apply
              </Button>
            </div>
          </form>

          {/* Extracted Parameter Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Ceiling Enforcement</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strict Budget Guarantee</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Priority Domain</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Item Hardware Setup</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Fulfillment Urgency</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="capitalize">{currentIntent.urgency} Standard Delivery</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => navigateTo('planning')}>
              Inspect & Edit Requirement Tasks
            </Button>
            <Button
              size="md"
              isLoading={isLoading}
              onClick={async () => {
                if (currentIntent && !executionPlan) {
                  await generatePlan(activeTier);
                }
                navigateTo('decision');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-[#0070BA] hover:bg-[#005ea6] w-full sm:w-auto"
            >
              View Optimized Product Decision
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
