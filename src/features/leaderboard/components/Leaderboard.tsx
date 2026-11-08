'use client';

import { useState, useEffect, useId } from 'react';
import { Trophy, HelpCircle, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { getLeaderboard, updateProfile } from '../api/leaderboard';
import type { LeaderboardEntry, LeaderboardTab } from '../types';
import { formatPercent } from '@/lib/format';
import { useUIStore } from '@/store/useUIStore';
import { ApiRequestError } from '@/lib/api';

export function Leaderboard() {
	const [activeTab, setActiveTab] = useState<LeaderboardTab>('sharpe');
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshIndex, setRefreshIndex] = useState(0);

	// Join form state
	const [displayNameInput, setDisplayNameInput] = useState('');
	const [consentChecked, setConsentChecked] = useState(false);
	const [formSubmitting, setFormSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const user = useUIStore((s) => s.user);
	const checkAuth = useUIStore((s) => s.checkAuth);
	const addToast = useUIStore((s) => s.addToast);

	const displayNameId = useId();
	const consentId = useId();

	useEffect(() => {
		let cancelled = false;
		getLeaderboard(activeTab)
			.then((page) => {
				if (cancelled) return;
				setEntries(page.items);
				setError(null);
				setLoading(false);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				const msg = err instanceof ApiRequestError ? err.message : 'Failed to load leaderboard';
				setError(msg);
				setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [activeTab, refreshIndex]);

	const handleTabChange = (tab: LeaderboardTab) => {
		if (tab === activeTab) {
			setRefreshIndex((idx) => idx + 1);
			return;
		}
		setLoading(true);
		setActiveTab(tab);
	};

	const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!consentChecked) {
			setFormError('You must consent to appear on the public leaderboard');
			return;
		}

		const trimmed = displayNameInput.trim();
		if (trimmed.length < 3 || trimmed.length > 20) {
			setFormError('Display name must be between 3 and 20 characters');
			return;
		}

		setFormSubmitting(true);
		setFormError(null);

		try {
			await updateProfile({
				display_name: trimmed,
				leaderboard_opt_in: true,
			});
			await checkAuth();
			addToast('Joined the leaderboard successfully!', 'success');
			setDisplayNameInput('');
			setConsentChecked(false);
			setRefreshIndex((idx) => idx + 1);
		} catch (err) {
			if (err instanceof ApiRequestError) {
				if (err.code === 'CONFLICT' || err.status === 409) {
					setFormError('Display name is already taken. Please choose another.');
				} else {
					setFormError(err.message);
				}
			} else {
				setFormError('Failed to join leaderboard');
			}
		} finally {
			setFormSubmitting(false);
		}
	};

	const handleLeave = async () => {
		setFormSubmitting(true);
		setFormError(null);
		try {
			await updateProfile({
				leaderboard_opt_in: false,
			});
			await checkAuth();
			addToast('You have left the leaderboard.', 'info');
			setRefreshIndex((idx) => idx + 1);
		} catch (err) {
			const msg = err instanceof ApiRequestError ? err.message : 'Failed to opt out';
			setFormError(msg);
		} finally {
			setFormSubmitting(false);
		}
	};

	const isOptedIn = Boolean(user?.leaderboard_opt_in);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
						<Trophy className="h-6 w-6" aria-hidden="true" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-white">Leaderboard</h1>
				</div>
				<p className="text-sm text-zinc-400 flex items-center gap-1.5">
					<HelpCircle className="h-4 w-4 text-zinc-500 shrink-0" aria-hidden="true" />
					<span>
						<strong className="text-zinc-200">Why Sharpe?</strong> It rewards return per unit of risk.
					</span>
				</p>
			</div>

			{/* Join Form / Status Card */}
			<div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-white mb-2">Join the leaderboard</h2>
				{isOptedIn ? (
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm text-emerald-400">
							<UserCheck className="h-5 w-5" aria-hidden="true" />
							<span>
								You are currently on the leaderboard as{' '}
								<strong className="text-white">{user?.display_name || 'Anonymous'}</strong>.
							</span>
						</div>
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={handleLeave}
								disabled={formSubmitting}
								className="text-xs text-zinc-400 hover:text-red-400 underline transition-colors disabled:opacity-50"
							>
								Leave leaderboard
							</button>
						</div>
					</div>
				) : (
					<form onSubmit={handleJoin} className="space-y-4 max-w-lg">
						<p className="text-xs text-zinc-400 leading-relaxed">
							Compete with other traders. Your real name, email, account ID and cash balance are never shared.
						</p>

						<div>
							<label htmlFor={displayNameId} className="block text-xs font-medium text-zinc-300 mb-1">
								Display name
							</label>
							<input
								id={displayNameId}
								type="text"
								value={displayNameInput}
								onChange={(e) => setDisplayNameInput(e.target.value)}
								placeholder="e.g. bull_42"
								minLength={3}
								maxLength={20}
								pattern="^[A-Za-z0-9_-]{3,20}$"
								required
								disabled={formSubmitting}
								className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
							/>
							<p className="text-[11px] text-zinc-500 mt-1">3–20 characters: letters, numbers, hyphens or underscores.</p>
						</div>

						<div className="flex items-start gap-2.5">
							<input
								id={consentId}
								type="checkbox"
								checked={consentChecked}
								onChange={(e) => setConsentChecked(e.target.checked)}
								disabled={formSubmitting}
								className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950"
							/>
							<label htmlFor={consentId} className="text-xs text-zinc-400 leading-snug cursor-pointer">
								I consent to showing my pseudonymous handle and risk-adjusted performance on the public leaderboard.
							</label>
						</div>

						{formError && (
							<div role="alert" className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-lg">
								<AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
								<span>{formError}</span>
							</div>
						)}

						<button
							type="submit"
							disabled={formSubmitting || !consentChecked || displayNameInput.trim().length < 3}
							className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{formSubmitting ? 'Joining…' : 'Join leaderboard'}
						</button>
					</form>
				)}
			</div>

			{/* Tabs & Table */}
			<div className="space-y-4">
				{/* Tab List */}
				<div
					role="tablist"
					aria-label="Leaderboard metrics"
					className="flex border-b border-zinc-800 gap-6"
				>
					<button
						type="button"
						role="tab"
						id="tab-sharpe"
						aria-selected={activeTab === 'sharpe'}
						aria-controls="leaderboard-panel"
						onClick={() => handleTabChange('sharpe')}
						className={`pb-3 text-sm font-medium transition-colors relative ${
							activeTab === 'sharpe'
								? 'text-white border-b-2 border-emerald-500 font-semibold'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						Risk-adjusted (Sharpe)
					</button>

					<button
						type="button"
						role="tab"
						id="tab-return"
						aria-selected={activeTab === 'return'}
						aria-controls="leaderboard-panel"
						onClick={() => handleTabChange('return')}
						className={`pb-3 text-sm font-medium transition-colors relative ${
							activeTab === 'return'
								? 'text-white border-b-2 border-emerald-500 font-semibold'
								: 'text-zinc-400 hover:text-zinc-200'
						}`}
					>
						Total return
					</button>
				</div>

				{/* Panel Content */}
				<div
					role="tabpanel"
					id="leaderboard-panel"
					aria-labelledby={activeTab === 'sharpe' ? 'tab-sharpe' : 'tab-return'}
					className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm"
				>
					{loading ? (
						<div className="p-8 text-center text-sm text-zinc-500">Loading rankings…</div>
					) : error ? (
						<div role="alert" className="p-8 text-center text-sm text-red-400">
							{error}
						</div>
					) : entries.length === 0 ? (
						<div className="p-12 text-center">
							<ShieldCheck className="h-10 w-10 text-zinc-600 mx-auto mb-3" aria-hidden="true" />
							<p className="text-sm text-zinc-400">No ranked traders yet.</p>
							{activeTab === 'sharpe' && (
								<p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
									Sharpe ratio ranking requires at least 5 days of trading history. Fresh accounts appear on Total return first.
								</p>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm text-zinc-300">
								<thead className="bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
									<tr>
										<th scope="col" className="px-6 py-3.5 w-16 text-center">Rank</th>
										<th scope="col" className="px-6 py-3.5">Trader</th>
										<th scope="col" className="px-6 py-3.5 text-right">Total return</th>
										<th scope="col" className="px-6 py-3.5 text-right">Sharpe ratio</th>
										<th scope="col" className="px-6 py-3.5 text-right">Max drawdown</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-800/60 font-mono text-xs sm:text-sm">
									{entries.map((entry) => {
										const isMe = entry.is_me;
										return (
											<tr
												key={`${entry.rank}-${entry.display_name}`}
												className={`transition-colors ${
													isMe
														? 'bg-emerald-500/10 border-l-4 border-emerald-500 font-semibold text-white'
														: 'hover:bg-zinc-900/40 text-zinc-300'
												}`}
											>
												<td className="px-6 py-4 text-center font-bold">
													<span className={entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-zinc-300' : entry.rank === 3 ? 'text-amber-600' : 'text-zinc-500'}>
														#{entry.rank}
													</span>
												</td>
												<td className="px-6 py-4 font-sans font-medium text-white flex items-center gap-2">
													<span>{entry.display_name}</span>
													{isMe && (
														<span className="px-1.5 py-0.5 text-[11px] font-bold uppercase rounded bg-emerald-500 text-black">
															You
														</span>
													)}
												</td>
												<td className="px-6 py-4 text-right">
													<span className={entry.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
														{formatPercent(entry.total_return_pct)}
													</span>
												</td>
												<td className="px-6 py-4 text-right">
													{entry.sharpe_ratio != null ? entry.sharpe_ratio.toFixed(2) : <span className="text-zinc-600">—</span>}
												</td>
												<td className="px-6 py-4 text-right text-zinc-400">
													{entry.max_drawdown_pct != null ? formatPercent(entry.max_drawdown_pct) : <span className="text-zinc-600">—</span>}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
