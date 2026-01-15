'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange, getDefaultClassNames } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  minDate,
  disabled = false,
  placeholder = 'Selecione o período',
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    startDate || endDate
      ? { from: startDate || undefined, to: endDate || undefined }
      : undefined
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultClassNames = getDefaultClassNames();

  // Sincronizar range com props
  useEffect(() => {
    setRange(
      startDate || endDate
        ? { from: startDate || undefined, to: endDate || undefined }
        : undefined
    );
  }, [startDate, endDate]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatar exibição das datas
  const formatDisplayDate = () => {
    if (!range?.from) return placeholder;
    if (!range?.to) return format(range.from, 'dd/MM/yyyy', { locale: ptBR });
    return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`;
  };

  // Handler de seleção
  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    onRangeChange(selectedRange?.from || null, selectedRange?.to || null);

    // Fechar apenas quando ambas as datas estiverem selecionadas
    if (selectedRange?.from && selectedRange?.to) {
      setTimeout(() => setIsOpen(false), 200);
    }
  };

  // Limpar seleção
  const handleClear = () => {
    setRange(undefined);
    onRangeChange(null, null);
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'border border-gray-300 rounded-lg bg-white',
          'text-sm text-gray-900',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent',
          'transition-colors min-h-[44px]',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          !range?.from && 'text-gray-500'
        )}
      >
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="flex-1 truncate">{formatDisplayDate()}</span>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover com calendários */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 left-0">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
            disabled={minDate ? { before: minDate } : undefined}
            showOutsideDays
            classNames={{
              // Estrutura principal
              months: `${defaultClassNames.months} flex gap-4 flex-col sm:flex-row`,
              month: `${defaultClassNames.month} space-y-4`,
              month_caption: `${defaultClassNames.month_caption} flex justify-center pt-1 relative items-center`,
              caption_label: `${defaultClassNames.caption_label} text-sm font-medium text-gray-900`,
              nav: `${defaultClassNames.nav} space-x-1 flex items-center`,
              button_previous: cn(
                defaultClassNames.button_previous,
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                'inline-flex items-center justify-center rounded-md',
                'hover:bg-gray-100 transition-colors absolute left-1'
              ),
              button_next: cn(
                defaultClassNames.button_next,
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                'inline-flex items-center justify-center rounded-md',
                'hover:bg-gray-100 transition-colors absolute right-1'
              ),
              // Tabela
              month_grid: `${defaultClassNames.month_grid} w-full border-collapse space-y-1`,
              weekdays: `${defaultClassNames.weekdays} flex`,
              weekday: `${defaultClassNames.weekday} text-gray-500 rounded-md w-9 font-normal text-[0.8rem]`,
              week: `${defaultClassNames.week} flex w-full mt-2`,
              // Células e dias
              day: cn(
                defaultClassNames.day,
                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
              ),
              day_button: cn(
                defaultClassNames.day_button,
                'h-9 w-9 p-0 font-normal',
                'inline-flex items-center justify-center rounded-md',
                'hover:bg-gray-100 transition-colors',
                'aria-selected:opacity-100'
              ),
              // Estados de seleção
              range_start: `${defaultClassNames.range_start} bg-pink-500 text-white hover:bg-pink-600 rounded-l-md`,
              range_end: `${defaultClassNames.range_end} bg-pink-500 text-white hover:bg-pink-600 rounded-r-md`,
              range_middle: `${defaultClassNames.range_middle} bg-pink-50 text-pink-900 rounded-none`,
              selected: `${defaultClassNames.selected} bg-pink-500 text-white hover:bg-pink-600`,
              today: `${defaultClassNames.today} bg-gray-100 text-gray-900`,
              outside: `${defaultClassNames.outside} text-gray-400 opacity-50`,
              disabled: `${defaultClassNames.disabled} text-gray-400 opacity-50 cursor-not-allowed`,
              hidden: `${defaultClassNames.hidden} invisible`,
              // Chevron para navegação
              chevron: `${defaultClassNames.chevron} fill-gray-500`,
            }}
          />

          {/* Footer com botão limpar */}
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
