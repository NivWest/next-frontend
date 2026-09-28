'use client';

import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';
import { Vault as VaultIcon, ArrowRightLeft, Percent, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export function Vault() {
  const { cash } = usePortfolioStore();
  const { addToast, isAuthenticated } = useUIStore();
  const [amount, setAmount] = useState('');
  const [vaultBalance, setVaultBalance] = useState(0); // Mock local state for vault
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center mt-20">
        <VaultIcon className="text-[#a1a1aa] w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to use The Vault</h2>
        <p className="text-[#a1a1aa] mb-6">Earn a risk-free 5.1% APY on your uninvested cash.</p>
        <a href="/api/v1/auth/login" className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400">
          Sign In
        </a>
      </div>
    );
  }

  const handleTransfer = () => {
    const val = Number(amount);
    if (!val || val <= 0) return addToast('Enter a valid amount', 'error');
    if (val > cash) return addToast('Insufficient uninvested cash', 'error');

    setIsProcessing(true);
    setTimeout(() => {
      setVaultBalance(prev => prev + val);
      // Ideally this would deduct from cash in the store, but we can just mock the UI for the PoC
      addToast(`Transferred $${val} to The Vault`, 'success');
      setAmount('');
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <VaultIcon className="text-yellow-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">The Vault</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-[#a1a1aa] mb-2">Vault Balance</h2>
          <div className="text-4xl font-bold text-white mb-1">${vaultBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="text-green-500 text-sm font-medium">+5.1% APY Active</div>
          
          <div className="mt-8 pt-8 border-t border-[#27272a]">
            <h3 className="text-sm font-medium text-white mb-4">Transfer Funds</h3>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-3 text-[#a1a1aa]">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-[#111111] border border-[#27272a] rounded-lg py-3 px-8 text-white outline-none focus:border-zinc-500"
                />
              </div>
              <button 
                onClick={handleTransfer}
                disabled={isProcessing}
                className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isProcessing ? 'Processing...' : 'Transfer to Vault'}
                {!isProcessing && <ArrowRightLeft size={16} />}
              </button>
            </div>
            <div className="text-xs text-[#a1a1aa] mt-3">Available cash to transfer: ${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
            <Percent className="text-green-500 mb-3 w-6 h-6" />
            <h3 className="text-white font-medium mb-1">Earn Daily</h3>
            <p className="text-sm text-[#a1a1aa]">Your uninvested cash earns 5.1% APY, paid out daily directly to your vault.</p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5">
            <ShieldCheck className="text-blue-500 mb-3 w-6 h-6" />
            <h3 className="text-white font-medium mb-1">FDIC Insured</h3>
            <p className="text-sm text-[#a1a1aa]">Funds swept to program banks are FDIC insured up to $2.5 million.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
