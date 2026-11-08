import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Leaderboard } from '../Leaderboard';
import type { LeaderboardPage } from '../../types';
import { useUIStore } from '@/store/useUIStore';

const getLeaderboardMock = vi.fn<(metric: string, limit?: number) => Promise<LeaderboardPage>>();
const updateProfileMock = vi.fn();

vi.mock('../../api/leaderboard', () => ({
	getLeaderboard: (metric: string) => getLeaderboardMock(metric),
	updateProfile: (req: unknown) => updateProfileMock(req),
}));

const mockSharpePage: LeaderboardPage = {
	items: [
		{
			rank: 1,
			display_name: 'whale_01',
			total_return_pct: 18.25,
			sharpe_ratio: 2.15,
			max_drawdown_pct: -3.4,
			is_me: false,
		},
		{
			rank: 2,
			display_name: 'bull_42',
			total_return_pct: 12.5,
			sharpe_ratio: 1.85,
			max_drawdown_pct: -5.1,
			is_me: true,
		},
	],
};

const mockReturnPage: LeaderboardPage = {
	items: [
		{
			rank: 1,
			display_name: 'bear_99',
			total_return_pct: 25.0,
			sharpe_ratio: null,
			max_drawdown_pct: null,
			is_me: false,
		},
		{
			rank: 2,
			display_name: 'bull_42',
			total_return_pct: 12.5,
			sharpe_ratio: 1.85,
			max_drawdown_pct: -5.1,
			is_me: true,
		},
	],
};

describe('Leaderboard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useUIStore.setState({
			user: {
				id: 1,
				name: 'Test Trader',
				email: 'test@example.com',
				role: 'member',
				balance: 100000,
				is_guest: false,
				display_name: null,
				leaderboard_opt_in: false,
			},
		});
		getLeaderboardMock.mockResolvedValue(mockSharpePage);
	});

	it('renders tabs "Risk-adjusted (Sharpe)" and "Total return", and explainer (AC5)', async () => {
		render(<Leaderboard />);
		await act(async () => {});

		expect(screen.getByRole('tab', { name: 'Risk-adjusted (Sharpe)' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Total return' })).toBeInTheDocument();
		expect(screen.getByText(/Why Sharpe\?/i)).toBeInTheDocument();
		expect(screen.getByText(/rewards return per unit of risk/i)).toBeInTheDocument();
	});

	it('shows "Join the leaderboard" form with consent checkbox unchecked by default (AC5)', async () => {
		render(<Leaderboard />);
		await act(async () => {});

		expect(screen.getByRole('heading', { level: 2, name: 'Join the leaderboard' })).toBeInTheDocument();
		const nameInput = screen.getByLabelText(/display name/i);
		expect(nameInput).toBeInTheDocument();
		expect(nameInput).toHaveValue('');

		const consentCheckbox = screen.getByRole('checkbox', {
			name: /i consent to showing my pseudonymous handle/i,
		});
		expect(consentCheckbox).toBeInTheDocument();
		expect(consentCheckbox).not.toBeChecked();

		const submitBtn = screen.getByRole('button', { name: /join leaderboard/i });
		expect(submitBtn).toBeDisabled();
	});

	it('highlights the caller row with a "You" label (AC5)', async () => {
		render(<Leaderboard />);
		await act(async () => {});

		expect(screen.getByText('bull_42')).toBeInTheDocument();
		expect(screen.getByText('You')).toBeInTheDocument();
	});

	it('switches tabs and requests the matching metric', async () => {
		getLeaderboardMock.mockResolvedValueOnce(mockSharpePage);
		render(<Leaderboard />);
		await act(async () => {});

		getLeaderboardMock.mockResolvedValueOnce(mockReturnPage);
		const returnTab = screen.getByRole('tab', { name: 'Total return' });
		await act(async () => {
			fireEvent.click(returnTab);
		});

		expect(getLeaderboardMock).toHaveBeenLastCalledWith('return');
		expect(screen.getByText('bear_99')).toBeInTheDocument();
	});

	it('submitting form with consent and valid handle calls updateProfile', async () => {
		updateProfileMock.mockResolvedValue({
			id: 1,
			name: 'Test Trader',
			email: 'test@example.com',
			role: 'member',
			balance: 100000,
			is_guest: false,
			display_name: 'trader_123',
			leaderboard_opt_in: true,
		});

		render(<Leaderboard />);
		await act(async () => {});

		const nameInput = screen.getByLabelText(/display name/i);
		const consentCheckbox = screen.getByRole('checkbox');

		fireEvent.change(nameInput, { target: { value: 'trader_123' } });
		fireEvent.click(consentCheckbox);

		const submitBtn = screen.getByRole('button', { name: /join leaderboard/i });
		expect(submitBtn).not.toBeDisabled();

		await act(async () => {
			fireEvent.click(submitBtn);
		});

		expect(updateProfileMock).toHaveBeenCalledWith({
			display_name: 'trader_123',
			leaderboard_opt_in: true,
		});
	});
});
