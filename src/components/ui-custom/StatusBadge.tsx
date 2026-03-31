import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage();

  const statusConfig = {
    paying: {
      bg: 'bg-[#1EEBBA]/10',
      text: 'text-[#0B3A3E]',
      border: 'border-[#1EEBBA]/30',
      label: t('statusPaying'),
    },
    overdue: {
      bg: 'bg-[#0B3A3E]',
      text: 'text-white',
      border: 'border-transparent',
      label: t('statusOverdue'),
    },
    completed: {
      bg: 'bg-transparent',
      text: 'text-[#0B3A3E]',
      border: 'border-[#0B3A3E]/30',
      label: t('statusCompleted'),
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}
