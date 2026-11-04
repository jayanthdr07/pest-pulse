import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-stone-200/80',
        className
      )}
    />
  );
};

export const CardSkeleton: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 3, className }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-8 w-24" />
      <div className="space-y-2 pt-2 border-t border-stone-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};
