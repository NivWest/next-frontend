import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LiveQuote } from '../../store/useLiveQuoteStore';
import { FlashValue } from '../FlashValue';

function makeLive(direction: 'up' | 'down' | null, seq: number): LiveQuote {
  return {
    quote: {
      orderbook_id: 'SIM-FJRD',
      symbol: 'FJRD',
      last: 100,
      bid: 99.9,
      ask: 100.1,
      change_percent: 0,
      currency: 'SEK',
      updated_at: '2026-11-08T12:00:00Z',
    },
    direction,
    seq,
  };
}

describe('FlashValue', () => {
  it('renders children with no flash class when direction is null', () => {
    render(<FlashValue live={makeLive(null, 0)}>100.00 SEK</FlashValue>);
    const span = screen.getByText('100.00 SEK');
    expect(span.className).not.toContain('price-flash-up');
    expect(span.className).not.toContain('price-flash-down');
  });

  it('adds price-flash-up when direction is up', () => {
    render(<FlashValue live={makeLive('up', 1)}>105.00 SEK</FlashValue>);
    const span = screen.getByText('105.00 SEK');
    expect(span.className).toContain('price-flash-up');
  });

  it('adds price-flash-down when direction is down', () => {
    render(<FlashValue live={makeLive('down', 2)}>95.00 SEK</FlashValue>);
    const span = screen.getByText('95.00 SEK');
    expect(span.className).toContain('price-flash-down');
  });
});
