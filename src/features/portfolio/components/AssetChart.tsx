'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function AssetChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('ONE_MONTH');
  
  // Default to Apple for now
  const orderbookID = '3323'; 
  
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchChart = async () => {
      try {
        const res = await api<any>(`stocks/chart?orderbookID=${orderbookID}&timePeriod=${timePeriod.toLowerCase()}`);
        const series = res.ohlc || res.dataSeries;
        if (series && isMounted) {
          const formattedData = series.map((pt: any) => {
            const date = new Date(pt.timestamp);
            return {
              date: `${date.getMonth()+1}/${date.getDate()}`,
              price: pt.close || pt.value
            };
          });
          setData(formattedData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchChart();
    return () => { isMounted = false; };
  }, [timePeriod, orderbookID]);

  // Mocked details for the header since we are focused on the chart
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const firstPrice = data.length > 0 ? data[0].price : 0;
  const changeVal = currentPrice - firstPrice;
  const changePct = firstPrice > 0 ? (changeVal / firstPrice) * 100 : 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
          </div>
          <div>
            <div className="text-white font-semibold flex items-center gap-2">
              AAPL
            </div>
            <div className="text-xs text-[#a1a1aa]">Apple Inc. · NASDAQ</div>
          </div>
        </div>
        
        <div className="flex space-x-1 text-xs text-[#a1a1aa] bg-[#111111] p-1 rounded-lg">
          {[
            { label: '1M', val: 'ONE_MONTH' }, 
            { label: '1Y', val: 'ONE_YEAR' }
          ].map((tf) => (
            <button 
              key={tf.val} 
              onClick={() => setTimePeriod(tf.val)}
              className={`px-2 py-1 rounded ${timePeriod === tf.val ? 'bg-[#27272a] text-white' : 'hover:text-white'}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        {loading ? (
           <div className="text-xl text-[#a1a1aa] flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading data...</div>
        ) : (
          <div className="text-3xl font-bold text-white mb-1 flex items-baseline gap-3">
            ${currentPrice.toFixed(2)}
            <span className={`text-sm font-medium flex items-center ${changeVal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <svg className={`w-3 h-3 mr-1 ${changeVal < 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              {changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)} ({changeVal >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[250px] w-full -ml-6 relative">
        {loading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10" />}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={changeVal >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={changeVal >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
              tickFormatter={(val) => `$${val.toFixed(0)}`}
              dx={-10}
            />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Price']}
              separator=": "
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: changeVal >= 0 ? '#22c55e' : '#ef4444' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={changeVal >= 0 ? "#22c55e" : "#ef4444"} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
