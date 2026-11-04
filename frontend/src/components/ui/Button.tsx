import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#2E7D32] hover:bg-[#256829] active:bg-[#1E5221] text-white shadow-xs focus:ring-[#2E7D32]',
    secondary:
      'bg-[#F4F6F3] hover:bg-[#EAEFE8] active:bg-[#DFE5DD] text-[#2D3E2F] border border-[#E2E8DF] focus:ring-[#2E7D32]',
    ghost:
      'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3] active:bg-[#EAEFE8] focus:ring-[#2E7D32]',
    outline:
      'border border-[#E2E8DF] bg-white hover:bg-[#F4F6F3] text-[#2D3E2F] focus:ring-[#2E7D32]',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs focus:ring-red-500',
    accent:
      'bg-[#D97746] hover:bg-[#C26535] active:bg-[#AC5427] text-white font-bold shadow-xs focus:ring-[#D97746]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] rounded-lg',
    md: 'text-xs sm:text-sm px-4 py-2.5 min-h-[44px] rounded-xl',
    lg: 'text-sm sm:text-base px-5 py-3 min-h-[48px] rounded-xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 min-w-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
