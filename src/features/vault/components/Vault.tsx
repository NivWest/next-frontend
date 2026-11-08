'use client';

import { useEffect, useState } from 'react';
import {
  Vault as VaultIcon,
  ArrowRightLeft,
  Percent,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { useVaultStore } from '../store/useVaultStore';
import { formatApy, formatOpportunityCost } from '../format';
import { formatMoney } from '@/lib/format';

export function Vault() {
  const { user, addToast, isAuthenticated } = useUIStore();
  const portfolio = usePortfolioStore((state) => state.portfolio);
  const fetchPortfolio = usePortfolioStore((state) => state.fetchPortfolio);
  const { vault, transactions, status, isProcessing, fetchVault, deposit, withdraw } = useVaultStore();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVault();
      fetchPortfolio();
    }
  }, [isAuthenticated, fetchVault, fetchPortfolio]);

  // Client-side visual ticker for interest earned between fetches
  useEffect(() => {
    if (!vault || vault.balance <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedMs((prev) => prev + 250);
    }, 250);
    return () => clearInterval(timer);
  }, [vault]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center mt-20">
        <VaultIcon className="text-[#a1a1aa] w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to use The Vault</h2>
        <p className="text-[#a1a1aa] mb-6">Earn a risk-free 5.10% APY on your uninvested cash.</p>
        <a href="/api/v1/auth/login" className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400">
          Sign In
        </a>
      </div>
    );
  }

  const cash = user?.balance ?? portfolio?.cash ?? 0;
  const vaultBalance = vault?.balance ?? 0;
  const apy = vault?.apy ?? 0.051;
  const projectedInterest = vault?.projected_monthly_interest_on_idle_cash ?? 0;

  // Visual compounding calculation for live ticker
  const visualExtra =
    vault && vaultBalance > 0 && elapsedMs > 0
      ? vaultBalance * (Math.pow(1 + apy, (elapsedMs / 1000) / (365 * 86400)) - 1)
      : 0;
  const displayInterestEarned = (vault?.interest_earned_total ?? 0) + visualExtra;

  const handleTransfer = async () => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      addToast('Enter a valid amount greater than 0', 'error');
      return;
    }

    if (activeTab === 'deposit') {
      if (val > cash) {
        addToast('Insufficient uninvested cash', 'error');
        return;
      }
      try {
        await deposit(val);
        addToast(`Transferred ${formatMoney(val)} to The Vault`, 'success');
        setAmount('');
        setElapsedMs(0);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Deposit failed';
        addToast(errorMsg, 'error');
      }
    } else {
      if (val > vaultBalance) {
        addToast('Insufficient vault balance', 'error');
        return;
      }
      try {
        await withdraw(val);
        addToast(`Withdrew ${formatMoney(val)} from The Vault`, 'success');
        setAmount('');
        setElapsedMs(0);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Withdrawal failed';
        addToast(errorMsg, 'error');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <VaultIcon className="text-yellow-500 w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold text-white">The Vault</h1>
            <p className="text-sm text-[#a1a1aa]">Risk-free yield & opportunity cost benchmark</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
          <Percent size={14} />
          <span>APY {formatApy(apy)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
            <h2 className="text-sm font-medium text-[#a1a1aa] uppercase tracking-wider">Vault balance</h2>
            <span className="text-xs text-emerald-400 font-medium">Interest accrues daily</span>
          </div>

          <div className="text-4xl font-bold text-white tracking-tight mb-2">
            {formatMoney(vaultBalance)}
          </div>

          {/* Opportunity cost line */}
          <div className="text-sm text-yellow-400/90 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-3 py-2 rounded-lg mb-6">
            <TrendingUp size={16} className="shrink-0" />
            <span data-testid="opportunity-cost-line">{formatOpportunityCost(projectedInterest)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#a1a1aa] pb-4 mb-6 border-b border-[#27272a]">
            <span>Interest earned to date:</span>
            <span className="font-mono text-emerald-400 text-sm font-semibold">
              {formatMoney(displayInterestEarned)}
            </span>
          </div>

          {/* Transfer Tabs */}
          <div className="mt-4">
            <div className="flex gap-2 p-1 bg-[#111111] rounded-lg border border-[#27272a] mb-4" role="tablist" aria-label="Vault transfer type">
              <button
                role="tab"
                aria-selected={activeTab === 'deposit'}
                onClick={() => {
                  setActiveTab('deposit');
                  setAmount('');
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'deposit'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Deposit
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'withdraw'}
                onClick={() => {
                  setActiveTab('withdraw');
                  setAmount('');
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'withdraw'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Withdraw
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="vault-amount-input" className="block text-xs text-[#a1a1aa] mb-1.5 font-medium">
                  {activeTab === 'deposit' ? 'Amount to deposit' : 'Amount to withdraw'}
                </label>
                <div className="relative">
                  <input
                    id="vault-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    aria-label="Transfer amount"
                    className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-3 px-4 text-white text-lg font-mono outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-[#a1a1aa] font-medium pointer-events-none">
                    SEK
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                <span>
                  {activeTab === 'deposit'
                    ? `Available cash: ${formatMoney(cash)}`
                    : `Available in vault: ${formatMoney(vaultBalance)}`}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(String(activeTab === 'deposit' ? cash : vaultBalance))}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Use max
                </button>
              </div>

              <button
                onClick={handleTransfer}
                disabled={isProcessing || status === 'loading'}
                className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {isProcessing ? (
                  'Processing...'
                ) : activeTab === 'deposit' ? (
                  <>
                    <span>Transfer to Vault</span>
                    <ArrowRightLeft size={16} />
                  </>
                ) : (
                  <>
                    <span>Withdraw from Vault</span>
                    <ArrowRightLeft size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pillar Explanations */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
            <Percent className="text-emerald-400 mb-3 w-6 h-6" />
            <h3 className="text-white font-medium mb-1">Opportunity Cost Benchmark</h3>
            <p className="text-sm text-[#a1a1aa]">
              The Vault earns a guaranteed {formatApy(apy)} APY compounded daily. Every trade you make has to beat this risk-free return to be worthwhile.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
            <Clock className="text-yellow-500 mb-3 w-6 h-6" />
            <h3 className="text-white font-medium mb-1">Daily Lazy Compounding</h3>
            <p className="text-sm text-[#a1a1aa]">
              Yield is calculated continuously using precise compounding interest math: balance × (1 + APY)^(elapsed/365).
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
            <ShieldCheck className="text-blue-400 mb-3 w-6 h-6" />
            <h3 className="text-white font-medium mb-1">Zero Market Risk</h3>
            <p className="text-sm text-[#a1a1aa]">
              Vault balances do not fluctuate with equity markets. They count towards your total equity and asset allocation.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Vault transactions">
              <thead className="text-xs text-[#a1a1aa] uppercase border-b border-[#27272a]">
                <tr>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="text-zinc-200">
                    <td className="py-3 font-medium flex items-center gap-2">
                      {tx.type === 'DEPOSIT' ? (
                        <>
                          <ArrowDownRight className="text-emerald-400" size={16} />
                          <span className="text-emerald-400">Deposit</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="text-yellow-400" size={16} />
                          <span className="text-yellow-400">Withdrawal</span>
                        </>
                      )}
                    </td>
                    <td className="py-3 font-mono">{formatMoney(tx.amount)}</td>
                    <td className="py-3 text-[#a1a1aa]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
