'use client';

import { useUIStore } from '@/store/useUIStore';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg min-w-[300px] border ${
            toast.type === 'success' ? 'bg-green-950/50 border-green-900 text-green-400' : 
            toast.type === 'error' ? 'bg-red-950/50 border-red-900 text-red-400' : 
            'bg-zinc-900 border-[#27272a] text-white'
          }`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-current opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
