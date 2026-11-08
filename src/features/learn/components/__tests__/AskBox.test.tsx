import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import * as aiApi from '@/features/ai/api/ai';
import type { AskResponse } from '@/features/ai/types';
import { AskBox } from '../AskBox';

const initialUI = useUIStore.getState();

const mockAnswer: AskResponse = {
  answer: 'Slippage is the difference between the expected price of an order and the execution price.',
  citations: [
    {
      article_slug: 'slippage',
      article_title: 'Slippage',
      chunk_id: 'slippage-0',
      quoted_text: 'Slippage refers to the difference between the expected price of a trade and the actual price at which it is executed.',
    },
  ],
  model: 'claude-haiku-4-5-20251001',
  disclaimer: 'AI-generated · educational, not financial advice',
};

let askKnowledgeMock: Mock<(question: string) => Promise<AskResponse>>;

beforeEach(() => {
  askKnowledgeMock = vi.fn();
  vi.spyOn(aiApi, 'askKnowledge').mockImplementation(askKnowledgeMock);
  useUIStore.setState({ isAuthenticated: true });
});

afterEach(() => {
  cleanup();
  useUIStore.setState(initialUI, true);
  vi.restoreAllMocks();
});

describe('AskBox component', () => {
  it('renders sign-in prompt when unauthenticated', () => {
    useUIStore.setState({ isAuthenticated: false });

    render(<AskBox />);

    expect(screen.getByText('Ask TradeEdu AI')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Sign in to ask' });
    expect(link).toHaveAttribute('href', '/login?next=%2Flearn');
    expect(screen.queryByRole('textbox', { name: 'Ask a question' })).not.toBeInTheDocument();
  });

  it('renders question input and asks when authenticated', async () => {
    askKnowledgeMock.mockResolvedValue(mockAnswer);

    render(<AskBox />);

    const input = screen.getByRole('textbox', { name: 'Ask a question' });
    const button = screen.getByRole('button', { name: /Ask/ });

    expect(input).toBeInTheDocument();
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'What is slippage?' } });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(askKnowledgeMock).toHaveBeenCalledWith('What is slippage?');

    await waitFor(() => {
      expect(
        screen.getByText(/Slippage is the difference between the expected price/),
      ).toBeInTheDocument();
    });

    // Check numbered citation link [1] navigating to /learn/slippage
    const citationLinks = screen.getAllByRole('link', { name: /Citation \[1\]|Slippage|\[1\]/ });
    expect(citationLinks.some((l) => l.getAttribute('href') === '/learn/slippage')).toBe(true);

    // Sources section
    expect(screen.getByText('Sources')).toBeInTheDocument();

    // Disclaimer
    expect(screen.getByText('AI-generated · educational, not financial advice')).toBeInTheDocument();
  });

  it('renders zero citations abstain answer correctly', async () => {
    askKnowledgeMock.mockResolvedValue({
      answer: "I couldn't find this in the TradeEdu knowledge base.",
      citations: [],
      model: 'abstain',
      disclaimer: 'AI-generated · educational, not financial advice',
    });

    render(<AskBox />);

    const input = screen.getByRole('textbox', { name: 'Ask a question' });
    fireEvent.change(input, { target: { value: 'zxqv qqqq' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask/ }));

    await waitFor(() => {
      expect(screen.getByText("I couldn't find this in the TradeEdu knowledge base.")).toBeInTheDocument();
    });

    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('handles budget exceeded error', async () => {
    askKnowledgeMock.mockRejectedValue(
      new ApiRequestError('Rate limit exceeded', 429, 'AI_BUDGET_EXCEEDED'),
    );

    render(<AskBox />);

    const input = screen.getByRole('textbox', { name: 'Ask a question' });
    fireEvent.change(input, { target: { value: 'What is slippage?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask/ }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('You have used your AI allowance for today. It resets at midnight UTC.');
  });
});
