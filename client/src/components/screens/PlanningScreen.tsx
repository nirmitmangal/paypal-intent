import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { ArrowRight, RotateCcw, Plus, Trash2 } from 'lucide-react';

export function PlanningScreen() {
  const {
    currentIntent,
    requirements,
    updateRequirement,
    addRequirement,
    removeRequirement,
    generatePlan,
    activeTier,
    isLoading,
    navigateTo,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('accessories');
  const [newDescription, setNewDescription] = useState('');

  const totalCeiling = currentIntent?.budgetAmount || 350;

  const handleTogglePriority = (id: string, currentPriority: 'essential' | 'recommended' | 'optional') => {
    const nextPriority =
      currentPriority === 'essential'
        ? 'recommended'
        : currentPriority === 'recommended'
        ? 'optional'
        : 'essential';
    updateRequirement(id, { priority: nextPriority });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
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
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
        <div>
          <Badge variant="info">Planning Interface</Badge>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Goal Decomposition & Task Breakdown</h2>
          <p className="text-xs text-slate-500">
            Customize category priorities and budget allocations before solver execution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Category
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('workspace')}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Requirement Cards List */}
      <div className="space-y-3">
        {requirements.map((req) => {
          const estimatedCost = (totalCeiling * req.budgetShare) / 100;
          return (
            <Card key={req.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{req.name}</span>
                    <button
                      onClick={() => handleTogglePriority(req.id, req.priority)}
                      className="cursor-pointer"
                      title="Click to toggle priority"
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

                {/* Budget Share Meter & Actions */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="w-44 text-right space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Budget Share:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {req.budgetShare}% (~{formatCurrency(estimatedCost)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0070BA] h-full rounded-full transition-all"
                        style={{ width: `${req.budgetShare}%` }}
                      />
                    </div>
                  </div>

                  {requirements.length > 2 && (
                    <button
                      onClick={() => removeRequirement(req.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <span className="text-xs text-slate-500">
          Priorities and shares directly bound the knapsack solver to stay under ${totalCeiling}.
        </span>
        <Button
          size="md"
          isLoading={isLoading}
          onClick={async () => {
            if (currentIntent) {
              await generatePlan(activeTier);
            }
            navigateTo('decision');
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="bg-[#0070BA] hover:bg-[#005ea6] w-full sm:w-auto"
        >
          Generate Optimized Decision
        </Button>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Requirement Category"
        description="Specify an additional hardware role to include in the optimization bundle."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Category Display Name:</label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Ultra-Wide Monitor, Ergonomic Keyboard..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Catalog Category Tag:</label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
            >
              <option value="monitors">Monitors & Displays</option>
              <option value="keyboards">Keyboards (Mechanical & Wireless)</option>
              <option value="mice">Mice (Precision & Ergonomic)</option>
              <option value="headphones">Headphones & Audio</option>
              <option value="furniture">Furniture (Standing Desks & Chairs)</option>
              <option value="laptops">Laptops & Mobile Workstations</option>
              <option value="accessories">Accessories (Hubs, Docks & Cables)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Functional Requirement Description:</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Explain the technical requirement for this category..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
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
