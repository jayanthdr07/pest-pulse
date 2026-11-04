import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 text-stone-500 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone-500" />
      </div>
      <h3 className="text-base font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
