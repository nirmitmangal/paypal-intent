import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Send,
  Plus,
  Trash2,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export function IntentWorkspaceScreen() {
  const {
    currentIntent,
    refineIntent,
    requirements,
    updateRequirement,
    addRequirement,
    removeRequirement,
    executionPlan,
    generatePlan,
    activeTier,
    navigateTo,
    isLoading,
  } = useApp();

  const [refinementInput, setRefinementInput] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('accessories');
  const [newDescription, setNewDescription] = useState('');

  if (!currentIntent) {
    return (
      <div className="text-center py-20 space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0070BA] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">No Active Intent Session</h3>
          <p className="text-xs text-slate-500">
            Please state a purchasing goal from the home screen to generate an AI decomposition.
          </p>
        </div>
        <Button onClick={() => navigateTo('home')}>Go to Home</Button>
      </div>
    );
  }

  const totalCeiling = currentIntent.budgetAmount || 350;

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementInput.trim()) return;
    await refineIntent(refinementInput.trim());
    setRefinementInput('');
  };

  const handleTogglePriority = (id: string, currentPriority: 'essential' | 'recommended' | 'optional') => {
    const nextPriority =
      currentPriority === 'essential'
        ? 'recommended'
        : currentPriority === 'recommended'
        ? 'optional'
        : 'essential';
    updateRequirement(id, { priority: nextPriority });
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    addRequirement({
      name: newCategoryName.trim(),
      categoryId: newCategoryId,
      priority: 'recommended',
      budgetShare: 15,
      description: newDescription.trim() || 'Custom component category requirement.',
    });

    setNewCategoryName('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 text-left">
      {/* Top Header & Session Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info">Goal Decomposition</Badge>
            <span className="text-[11px] text-slate-400 font-mono">Session: {currentIntent.id}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Goal Requirements & Category Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Review the extracted purchasing roles, toggle requirement priorities, or adjust budget distribution.
          </p>
        </div>

        <Badge variant="success">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Intent Analyzed & Grounded</span>
        </Badge>
      </div>

      {/* Main Intent Overview Card */}
      <Card className="border-slate-300/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0070BA]">
                Synthesized Objective
              </span>
              <CardTitle className="mt-0.5 text-xl text-slate-900 font-bold">
                {currentIntent.parsedObjective || 'Workstation Equipment Goal'}
              </CardTitle>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block font-medium">Stated Budget Ceiling</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(currentIntent.budgetAmount, currentIntent.budgetCurrency)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-6">
          {/* Verbatim Prompt Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
              Original Natural Language Request:
            </span>
            <p className="text-sm text-slate-800 font-medium italic leading-relaxed">
              "{currentIntent.rawPrompt}"
            </p>
          </div>

          {/* Conversational Refinement Bar */}
          <form onSubmit={handleRefine} className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/70 space-y-2.5">
            <label htmlFor="refine-input" className="text-xs font-bold text-[#003087] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0070BA]" />
              <span>Refine goal or add constraints (e.g., "Must include USB-C", "Prioritize quiet keys"):</span>
            </label>

            <div className="flex gap-2">
              <input
                id="refine-input"
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="Type an adjustment, additional preference, or constraint..."
                className="flex-1 bg-white border border-blue-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA] focus:ring-1 focus:ring-[#0070BA]"
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

          {/* Detected Product Categories List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0070BA]" />
                  Detected Product Requirements ({requirements.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Click priority pills to toggle between Essential, Recommended, or Optional.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Category
              </Button>
            </div>

            <div className="space-y-2.5">
              {requirements.map((req) => {
                const estimatedCost = (totalCeiling * req.budgetShare) / 100;
                return (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{req.name}</span>
                        <button
                          type="button"
                          onClick={() => handleTogglePriority(req.id, req.priority)}
                          className="cursor-pointer"
                          title="Click to toggle requirement priority"
                        >
                          <Badge
                            variant={
                              req.priority === 'essential'
                                ? 'info'
                                : req.priority === 'recommended'
                                ? 'neutral'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {req.priority}
                          </Badge>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{req.description}</p>
                    </div>

                    {/* Budget Share Gauge */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                      <div className="w-40 text-right space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Target Share:</span>
                          <span className="font-bold text-slate-800">
                            {req.budgetShare}% (~{formatCurrency(estimatedCost)})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#0070BA] h-full rounded-full transition-all"
                            style={{ width: `${req.budgetShare}%` }}
                          />
                        </div>
                      </div>

                      {requirements.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(req.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remove requirement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Boundaries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Budget Governance
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strict Hard Ceiling Defense</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Optimization Engine
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0070BA]" />
                <span>Exact Multi-Choice Knapsack</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Timeline
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="capitalize">{currentIntent.urgency} Delivery Standard</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('planning')}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            >
              Advanced Planning View
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
              className="bg-[#0070BA] hover:bg-[#005ea6] text-white w-full sm:w-auto shadow-sm"
            >
              Generate Optimized Decision Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Requirement Category"
        description="Introduce a new product category requirement to be solved under the stated budget ceiling."
      >
        <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Desk Mat, Web Camera, USB Hub"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0070BA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Catalog Domain Mapping</label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0070BA]"
            >
              <option value="accessories">Accessories</option>
              <option value="keyboards">Keyboards</option>
              <option value="mice">Mice</option>
              <option value="headphones">Headphones</option>
              <option value="monitors">Monitors</option>
              <option value="furniture">Furniture</option>
              <option value="laptops">Laptops</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Requirement Specification</label>
            <textarea
              rows={2}
              placeholder="Describe attributes needed (e.g., must be ergonomic, low-latency, under 150g)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0070BA] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
