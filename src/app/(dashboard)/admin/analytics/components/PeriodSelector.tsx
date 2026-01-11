'use client';

import { type Period } from '../page';

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${period === p.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
