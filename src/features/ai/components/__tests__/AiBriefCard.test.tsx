import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import * as aiApi from '../../api/ai';
import type { InstrumentBrief } from '../../types';
import { AiBriefCard, GENERATE_LABEL, GENERATING_LABEL } from '../AiBriefCard';

const initialUI = useUIStore.getState();

const mockBrief: InstrumentBrief = {
  orderbook_id: 'SIM-FJRD',
  generated_at: '2026-11-08T12:00:00Z',
  model: 'fake',
  prompt_version: 'v1',
  cached: false,
  disclaimer: 'AI-generated · educational, not financial advice',
  brief: {
    summary: 'FAKE: Fjord Robotics (FJRD) trades at 100.00 SEK.',
    what_the_numbers_say: [
      { metric: 'P/E Ratio', value: '18.5', explanation: 'Reasonable valuation.' },
    ],
    risks: ['High competition in warehouse robotics'],
    beginner_takeaway: 'Promising growth company for long-term investors.',
  },
};

let getBriefMock: Mock<(orderbookId: string) => Promise<InstrumentBrief>>;

beforeEach(() => {
  getBriefMock = vi.fn();
  vi.spyOn(aiApi, 'getInstrumentBrief').mockImplementation(getBriefMock);
  useUIStore.setState({ isAuthenticated: true });
});

afterEach(() => {
  cleanup();
  useUIStore.setState(initialUI, true);
  vi.restoreAllMocks();
});

describe('AiBriefCard', () => {
  it('renders a sign-in link when unauthenticated', () => {
    useUIStore.setState({ isAuthenticated: false });
    render(<AiBriefCard orderbookId="SIM-FJRD" />);

    expect(screen.getByRole('heading', { level: 2, name: 'AI brief' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in for an AI brief' })).toHaveAttribute(
      'href',
      '/login?next=%2Fmarkets%2FSIM-FJRD',
    );
    expect(screen.queryByRole('button', { name: GENERATE_LABEL })).not.toBeInTheDocument();
  });

  it('renders "Generate brief" button when authenticated and fetches brief on click', async () => {
    let resolveBrief: (val: InstrumentBrief) => void;
    const briefPromise = new Promise<InstrumentBrief>((resolve) => {
      resolveBrief = resolve;
    });
    getBriefMock.mockReturnValue(briefPromise);

    render(<AiBriefCard orderbookId="SIM-FJRD" />);

    const button = screen.getByRole('button', { name: GENERATE_LABEL });
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/plain-language explanation/)).toBeInTheDocument();

    fireEvent.click(button);

    expect(button).toHaveTextContent(GENERATING_LABEL);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(getBriefMock).toHaveBeenCalledWith('SIM-FJRD');

    resolveBrief!(mockBrief);

    await waitFor(() => {
      expect(screen.getByText('FAKE: Fjord Robotics (FJRD) trades at 100.00 SEK.')).toBeInTheDocument();
    });

    expect(screen.getByText('What the numbers say')).toBeInTheDocument();
    expect(screen.getByText('P/E Ratio')).toBeInTheDocument();
    expect(screen.getByText('18.5')).toBeInTheDocument();
    expect(screen.getByText('Reasonable valuation.')).toBeInTheDocument();

    expect(screen.getByText('Risks')).toBeInTheDocument();
    expect(screen.getByText('High competition in warehouse robotics')).toBeInTheDocument();

    expect(screen.getByText('Beginner takeaway:')).toBeInTheDocument();
    expect(screen.getByText(/Promising growth company/)).toBeInTheDocument();

    expect(screen.getByText('AI-generated · educational, not financial advice')).toBeInTheDocument();
  });

  it('shows an alert when generation fails', async () => {
    getBriefMock.mockRejectedValue(
      new ApiRequestError('exceeded', 429, 'AI_BUDGET_EXCEEDED'),
    );

    render(<AiBriefCard orderbookId="SIM-FJRD" />);

    fireEvent.click(screen.getByRole('button', { name: GENERATE_LABEL }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'You have used your AI allowance for today. It resets at midnight UTC.',
    );
  });

  it('resets state when orderbookId changes', async () => {
    getBriefMock.mockResolvedValue(mockBrief);

    const { rerender } = render(<AiBriefCard orderbookId="SIM-FJRD" />);

    fireEvent.click(screen.getByRole('button', { name: GENERATE_LABEL }));

    await screen.findByText('FAKE: Fjord Robotics (FJRD) trades at 100.00 SEK.');

    rerender(<AiBriefCard orderbookId="SIM-NVE" />);

    expect(screen.queryByText('FAKE: Fjord Robotics (FJRD) trades at 100.00 SEK.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: GENERATE_LABEL })).toBeInTheDocument();
  });
});
