import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface RiskPillProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'Normal' | 'Moderate' | 'High' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  customLabel?: string;
}

export const RiskPill: React.FC<RiskPillProps> = ({
  level,
  size = 'md',
  showIcon = true,
  className,
  customLabel,
}) => {
  const norm = String(level).toUpperCase();

  let config = {
    label: customLabel || 'Low Risk',
    bg: 'bg-[#EBF7EE] text-[#2E7D32] border-[#C8E6C9]',
    dot: 'bg-[#2E7D32]',
    icon: CheckCircle2,
    iconColor: 'text-[#2E7D32]',
  };

  if (norm === 'HIGH' || norm === 'CRITICAL' || norm === 'ALERT') {
    config = {
      label: customLabel || 'High Risk',
      bg: 'bg-[#FFF5F2] text-[#B91C1C] border-[#FCD9CF]',
      dot: 'bg-[#D97746]',
      icon: AlertCircle,
      iconColor: 'text-[#D97746]',
    };
  } else if (norm === 'MEDIUM' || norm === 'MODERATE' || norm === 'ATTENTION') {
    config = {
      label: customLabel || 'Moderate Risk',
      bg: 'bg-[#FEF7EC] text-[#B45309] border-[#FDE68A]',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    };
  }

  const Icon = config.icon;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full border shadow-2xs',
        config.bg,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('w-3.5 h-3.5 shrink-0', config.iconColor)} />}
      <span>{config.label}</span>
    </span>
  );
};
