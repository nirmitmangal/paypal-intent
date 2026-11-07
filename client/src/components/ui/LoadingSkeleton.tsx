import { cn } from '../../lib/utils';

export function LoadingSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-200/70', className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <LoadingSkeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-2/3" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-4/5" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <LoadingSkeleton className="h-6 w-20" />
        <LoadingSkeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}
