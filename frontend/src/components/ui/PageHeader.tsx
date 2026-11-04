import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  category,
  icon: Icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4',
        className
      )}
    >
      <div className="space-y-1.5 max-w-3xl">
        {category && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-white/10 uppercase tracking-wider">
            {Icon && <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            <span>{category}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-emerald-100/85 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 flex items-center gap-2.5 pt-2 md:pt-0">
          {action}
        </div>
      )}
    </div>
  );
};

