'use client';

import { HISTORY_RANGES, type HistoryRange } from '../types';

interface RangeSelectorProps {
  value: HistoryRange;
  onChange: (range: HistoryRange) => void;
  /** Accessible name of the button group. */
  label?: string;
}

/** `role="group"` of range buttons (1D 1W 1M All); the selected one has `aria-pressed="true"`. */
export function RangeSelector({ value, onChange, label = 'Equity range' }: RangeSelectorProps) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {HISTORY_RANGES.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              selected ? 'bg-zinc-700 text-white' : 'text-[#a1a1aa] hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
