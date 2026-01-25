'use client';

import type { FeedSortType } from '@/actions/feed';

interface SortSelectorProps {
  value: FeedSortType;
  onChange: (sort: FeedSortType) => void;
}

const sortOptions: { value: FeedSortType; label: string; icon: string }[] = [
  { value: 'new', label: 'Recentes', icon: '🕐' },
  { value: 'top', label: 'Curtidos', icon: '❤️' },
  { value: 'comments', label: 'Comentados', icon: '💬' },
  { value: 'hot', label: 'Em alta', icon: '🔥' },
];

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-1">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
}
