import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export interface AIInsightCardProps {
  rationale?: string;
  essentialCount?: number;
  totalRequirements?: number;
  compatibilityVerified?: boolean;
  modelName?: string;
  className?: string;
}

export function AIInsightCard({
  rationale = 'Balanced high-end productivity peripherals within budget ceiling. Verified USB-C host compatibility across keyboard and screenbar.',
  essentialCount = 4,
  totalRequirements = 4,
  compatibilityVerified = true,
  modelName = 'qwen2.5:3b (Local)',
  className,
}: AIInsightCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-900 to-[#0A1128] text-white rounded-[24px] p-6 shadow-md border border-blue-800/40 text-left space-y-4 relative overflow-hidden',
        className
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-300 block">
              Neural Engine
            </span>
            <h4 className="font-bold text-sm text-white">AI Decision Intelligence</h4>
          </div>
        </div>

        <Badge variant="neutral" size="sm" className="bg-white/10 text-blue-200 border-white/20 text-[10px]">
          {modelName}
        </Badge>
      </div>

      {/* Rationale Quote */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-blue-100/90 leading-relaxed italic">
        "{rationale}"
      </div>

      {/* Specifications & Checks */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-blue-200/70 block">Requirements:</span>
            <span className="font-bold text-white text-[11px]">
              {essentialCount}/{totalRequirements} Essential Met
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] text-blue-200/70 block">Hardware Checks:</span>
            <span className="font-bold text-white text-[11px]">
              {compatibilityVerified ? '100% Compatible' : 'Review Needed'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Pill */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70 font-mono">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Deterministic 0/1 Knapsack Verified</span>
        </span>
        <span className="text-emerald-400 font-bold">100% Feasible</span>
      </div>
    </div>
  );
}
