import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AllocationChart, formatWeight, sliceColors } from '../AllocationChart';
import type { AllocationSlice } from '../../types';

const slices: AllocationSlice[] = [
  { label: 'FJRD', orderbook_id: 'SIM-FJRD', value: 10000, weight: 10 },
  { label: 'NVE', orderbook_id: 'SIM-NVE', value: 5000, weight: 5 },
  { label: 'Cash', orderbook_id: null, value: 85000, weight: 85 },
];

describe('sliceColors', () => {
  it('gives positions distinct colours and cash the neutral one', () => {
    const colors = sliceColors(slices);
    expect(colors[0]).not.toBe(colors[1]);
    expect(colors[2]).toBe('#71717a');
    expect(sliceColors([slices[2]])).toEqual(['#71717a']);
  });

  it('cycles when there are more positions than colours', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ label: `S${i}`, orderbook_id: `SIM-${i}`, value: 1, weight: 1 }));
    const colors = sliceColors(many);
    expect(colors[8]).toBe(colors[0]);
  });
});

describe('formatWeight', () => {
  it.each([
    [100, '100.00%'],
    [10, '10.00%'],
    [33.333, '33.33%'],
    [0, '0.00%'],
  ])('%s → %s', (w, text) => {
    expect(formatWeight(w)).toBe(text);
  });
});

describe('AllocationChart', () => {
  it('lists every slice in order in the legend, zero-weight cash included', () => {
    render(<AllocationChart allocation={[...slices.slice(0, 1), { label: 'Cash', orderbook_id: null, value: 0, weight: 0 }]} totalEquity={10000} />);
    const items = within(screen.getByRole('list', { name: 'Allocation' })).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual(['FJRD10,000.00 SEK10.00%', 'Cash0.00 SEK0.00%']);
  });

  it('shows the total in the donut', () => {
    render(<AllocationChart allocation={slices} totalEquity={100000} />);
    expect(screen.getByRole('img', { name: 'Allocation chart' })).toHaveTextContent('100,000.00 SEK');
  });
});
