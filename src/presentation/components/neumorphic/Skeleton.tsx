import React from 'react';
import { cn } from './Card';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gray-300/40 shadow-[var(--shadow-neo-pressed)] transition-all",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[24px] p-4 bg-[var(--color-neo-card)] shadow-[var(--shadow-neo-flat)] space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonGauge() {
  return (
    <div className="rounded-[24px] p-6 bg-[var(--color-neo-card)] shadow-[var(--shadow-neo-flat)] flex flex-col items-center justify-between h-72">
      <div className="w-full flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-36 w-36 rounded-full" />
      <div className="w-full flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-[24px] p-4 bg-[var(--color-neo-card)] shadow-[var(--shadow-neo-flat)] space-y-3">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
