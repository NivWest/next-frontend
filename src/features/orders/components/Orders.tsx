'use client';

import { ListOrdered, CheckCircle2, Clock } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export function Orders() {
  const { isAuthenticated } = useUIStore();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center mt-20">
        <ListOrdered className="text-[#a1a1aa] w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view Orders</h2>
        <p className="text-[#a1a1aa] mb-6">Create an account to track your trades, pending orders, and history.</p>
        <a href="/api/v1/auth/login" className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400">
          Sign In
        </a>
      </div>
    );
  }
  const mockOrders = [
    { id: 'ORD-7291', ticker: 'NVDA', type: 'Buy', orderType: 'Limit', shares: 10, price: 605.00, status: 'Pending', time: '10 mins ago' },
    { id: 'ORD-7290', ticker: 'AAPL', type: 'Buy', orderType: 'Market', shares: 50, price: 229.39, status: 'Filled', time: '2 hours ago' },
    { id: 'ORD-7289', ticker: 'TSLA', type: 'Sell', orderType: 'Stop', shares: 15, price: 185.20, status: 'Filled', time: 'Yesterday' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <ListOrdered className="text-white" />
        <h1 className="text-2xl font-bold text-white">Order History</h1>
      </div>

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
            <tr>
              <th className="px-6 py-4 font-medium">Asset</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
              <th className="px-6 py-4 font-medium text-right">Order Type</th>
              <th className="px-6 py-4 font-medium text-right">Qty</th>
              <th className="px-6 py-4 font-medium text-right">Price</th>
              <th className="px-6 py-4 font-medium text-right">Status</th>
              <th className="px-6 py-4 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {mockOrders.map(order => (
              <tr key={order.id} className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-4 font-medium text-white">{order.ticker}</td>
                <td className={`px-6 py-4 text-right font-medium ${order.type === 'Buy' ? 'text-green-500' : 'text-red-500'}`}>{order.type}</td>
                <td className="px-6 py-4 text-right text-white">{order.orderType}</td>
                <td className="px-6 py-4 text-right text-white">{order.shares}</td>
                <td className="px-6 py-4 text-right text-white">${order.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                  {order.status === 'Filled' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Clock size={14} className="text-yellow-500" />
                  )}
                  <span className={order.status === 'Filled' ? 'text-white' : 'text-yellow-500'}>{order.status}</span>
                </td>
                <td className="px-6 py-4 text-right text-[#a1a1aa]">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
