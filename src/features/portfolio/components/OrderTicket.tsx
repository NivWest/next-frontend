'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

export function OrderTicket() {
  const { cash, holdings, executeTrade } = usePortfolioStore();
  const { addToast } = useUIStore();
  
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [shares, setShares] = useState<number>(10);
  const [isExecuting, setIsExecuting] = useState(false);

  const ticker = 'NVDA';
  const currentPrice = 608.42; // Mocked real-time price
  const holding = holdings.find(h => h.ticker === ticker);
  const ownedShares = holding?.shares || 0;
  
  const maxBuy = Math.floor(cash / currentPrice);
  const maxSell = ownedShares;
  const totalValue = shares * currentPrice;

  const handlePercent = (pct: number) => {
    if (action === 'buy') {
      setShares(Math.floor(maxBuy * pct));
    } else {
      setShares(Math.floor(maxSell * pct));
    }
  };

  const handleSubmit = async () => {
    if (shares <= 0) return addToast('Please enter a valid share quantity.', 'error');
    if (action === 'sell' && shares > ownedShares) return addToast('Insufficient shares to sell.', 'error');
    if (action === 'buy' && totalValue > cash) return addToast('Insufficient buying power.', 'error');

    setIsExecuting(true);
    try {
      await executeTrade(ticker, 'NVIDIA Corp.', shares, action === 'buy' ? 'BUY' : 'SELL');
      addToast(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${shares} shares of ${ticker}.`, 'success');
      setShares(0); // Reset after trade
    } catch (e: any) {
      addToast(e.message || 'Trade failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-medium text-white mb-4">Order ticket</h3>
      
      <div className="flex bg-[#111111] p-1 rounded-lg mb-6">
        <button 
          onClick={() => setAction('buy')}
          className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${action === 'buy' ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
        >
          Buy
        </button>
        <button 
          onClick={() => setAction('sell')}
          className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${action === 'sell' ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
        >
          Sell
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        {['Market', 'Limit', 'Stop'].map(type => (
          <button 
            key={type}
            onClick={() => setOrderType(type as any)}
            className={`text-sm ${orderType === type ? 'text-white border-b border-white pb-1' : 'text-[#a1a1aa] hover:text-white pb-1 border-b border-transparent transition-colors'}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
          $ 
          <input 
            type="text" 
            value={totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            readOnly 
            className="bg-transparent border-none outline-none text-center w-[160px]"
          />
        </div>
        <div className="text-xs text-[#a1a1aa] mt-1 flex justify-center items-center gap-1">
          <input 
            type="number" 
            value={shares === 0 ? '' : shares} 
            onChange={(e) => setShares(Number(e.target.value))}
            className="bg-transparent border-b border-zinc-700 outline-none text-center w-12 text-white"
            placeholder="0"
          /> 
          shares of {ticker}
        </div>
      </div>

      <div className="flex justify-between gap-2 mb-6">
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <button 
            key={pct}
            onClick={() => handlePercent(pct)}
            className="flex-1 py-1 border border-[#27272a] rounded-full text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            {pct === 1 ? 'Max' : `${pct * 100}%`}
          </button>
        ))}
      </div>

      <div className="bg-[#111111] border border-[#27272a] rounded-lg p-3 flex justify-between items-center mb-6 cursor-pointer hover:bg-zinc-900 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
          </div>
          <span className="text-sm text-white">{ticker} <span className="text-[#a1a1aa]">· NVIDIA Corp.</span></span>
        </div>
        <ChevronDown size={16} className="text-[#a1a1aa]" />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={isExecuting}
        className="w-full bg-white text-black font-semibold py-3 rounded-lg mb-3 hover:bg-zinc-200 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isExecuting ? <Loader2 size={18} className="animate-spin" /> : null}
        {isExecuting ? 'Executing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${ticker}`}
      </button>

      <div className="text-center text-xs text-[#a1a1aa]">
        {action === 'buy' ? `Buying power $${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `${ownedShares} shares available`} · Fee $0
      </div>
    </div>
  );
}
