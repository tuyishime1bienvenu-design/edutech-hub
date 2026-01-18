import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  delay?: number;
}

const variantStyles = {
  default: 'bg-card border border-border',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
};

const iconStyles = {
  default: 'bg-muted text-foreground',
  primary: 'bg-white/20 text-white',
  secondary: 'bg-white/20 text-white',
  success: 'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
};

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
  delay = 0,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'default' ? 'text-muted-foreground' : 'text-current opacity-80'
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm flex items-center gap-1',
                variant === 'default' ? 'text-muted-foreground' : 'text-current opacity-80'
              )}
            >
              <span
                className={cn(
                  'font-semibold',
                  change.value >= 0 ? 'text-success' : 'text-destructive',
                  variant !== 'default' && 'text-current'
                )}
              >
                {change.value >= 0 ? '+' : ''}
                {change.value}%
              </span>
              <span>{change.label}</span>
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
