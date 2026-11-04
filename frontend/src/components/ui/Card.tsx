import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-[18px] border border-[#E2E8DF] shadow-[0_4px_20px_-2px_rgba(45,62,47,0.06),0_2px_6px_-1px_rgba(45,62,47,0.04)]',
        hover && 'hover:border-[#C8E6C9] hover:shadow-[0_6px_24px_-2px_rgba(45,62,47,0.09)] transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-5 pb-4 border-b border-[#E2E8DF]/60',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#EBF7EE] text-[#2E7D32] flex items-center justify-center shrink-0 border border-[#C8E6C9]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-[#2D3E2F] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#556857] mt-0.5 leading-normal">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
};
