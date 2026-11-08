import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RangeSelector } from '../RangeSelector';
import type { HistoryRange } from '../../types';

function group(): HTMLElement {
  return screen.getByRole('group', { name: 'Equity range' });
}

describe('RangeSelector', () => {
  it('renders 1D 1W 1M All in order with exact accessible names', () => {
    render(<RangeSelector value="1d" onChange={() => {}} />);
    const names = within(group()).getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['1D', '1W', '1M', 'All']);
  });

  it('marks only the selected range as pressed', () => {
    render(<RangeSelector value="1m" onChange={() => {}} />);
    for (const name of ['1D', '1W', 'All']) {
      expect(within(group()).getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
    expect(within(group()).getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    ['1D', '1d'],
    ['1W', '1w'],
    ['1M', '1m'],
    ['All', 'all'],
  ] as const)('clicking %s reports %s', (name, range) => {
    const onChange = vi.fn<(r: HistoryRange) => void>();
    const current: HistoryRange = range === '1d' ? 'all' : '1d';
    render(<RangeSelector value={current} onChange={onChange} />);
    fireEvent.click(within(group()).getByRole('button', { name }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(range);
  });

  it('does not report the range that is already selected', () => {
    const onChange = vi.fn<(r: HistoryRange) => void>();
    render(<RangeSelector value="1w" onChange={onChange} />);
    fireEvent.click(within(group()).getByRole('button', { name: '1W' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts another group name', () => {
    render(<RangeSelector value="1d" onChange={() => {}} label="History range" />);
    expect(screen.getByRole('group', { name: 'History range' })).toBeInTheDocument();
  });
});
