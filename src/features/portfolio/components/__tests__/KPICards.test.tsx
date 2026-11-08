import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { KPICards } from '../KPICards';
import type { Portfolio } from '@/features/portfolio/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';

const initialPortfolio = usePortfolioStore.getState();

const fresh: Portfolio = {
  cash: 100000,
  holdings_value: 0,
  vault_value: 0,
  total_equity: 100000,
  unrealized_pnl: 0,
  realized_pnl: 0,
  positions: [],
  top_movers: [],
};

function card(title: string): HTMLElement {
  return screen.getByRole('group', { name: title });
}

describe('KPICards', () => {
  afterEach(() => {
    usePortfolioStore.setState(initialPortfolio, true);
  });

  it('shows a dash in all four cards until a portfolio has loaded', () => {
    render(<KPICards />);

    for (const title of ['Total equity', 'Cash', 'Unrealized P&L', 'Realized P&L']) {
      expect(card(title)).toHaveTextContent('—');
      expect(card(title)).not.toHaveTextContent(/\d/);
    }
    expect(document.body.textContent).not.toContain('$');
  });

  it('shows a fresh portfolio in SEK', () => {
    usePortfolioStore.setState({ portfolio: fresh, portfolioStatus: 'ready' });

    render(<KPICards />);

    expect(screen.getAllByRole('group')).toHaveLength(4);
    expect(card('Total equity')).toHaveTextContent('100,000.00 SEK');
    expect(card('Cash')).toHaveTextContent('100,000.00 SEK');
    expect(card('Unrealized P&L')).toHaveTextContent('0.00 SEK');
    expect(card('Unrealized P&L')).toHaveTextContent('0.00%');
    expect(card('Realized P&L')).toHaveTextContent('0.00 SEK');
    expect(document.body.textContent).not.toContain('$');
    expect(screen.queryByText(/today/i)).toBeNull();
  });

  it('signs and colours P&L', () => {
    usePortfolioStore.setState({
      portfolio: { ...fresh, cash: 98996.5, holdings_value: 1100, total_equity: 100096.5, unrealized_pnl: 96.5, realized_pnl: -5 },
      portfolioStatus: 'ready',
    });

    render(<KPICards />);

    expect(card('Total equity')).toHaveTextContent('100,096.50 SEK');
    expect(card('Cash')).toHaveTextContent('98,996.50 SEK');
    const unrealized = within(card('Unrealized P&L')).getByText('+96.50 SEK');
    expect(unrealized).toHaveClass('text-green-500');
    expect(card('Unrealized P&L')).toHaveTextContent('+9.62%');
    expect(within(card('Realized P&L')).getByText('-5.00 SEK')).toHaveClass('text-red-500');
  });
});
