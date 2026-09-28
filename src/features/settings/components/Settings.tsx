'use client';

import { useUIStore } from '@/store/useUIStore';
import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const { addToast, isAuthenticated, user } = useUIStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center mt-20">
        <SettingsIcon className="text-[#a1a1aa] w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view Settings</h2>
        <p className="text-[#a1a1aa] mb-6">Create an account to manage your profile and preferences.</p>
        <a href="/api/v1/auth/login" className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400">
          Sign In
        </a>
      </div>
    );
  }

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    setTimeout(() => {
      addToast('Account deletion request submitted. Please check your email.', 'info');
      setIsDeleting(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="text-white" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Profile Information</h2>
        <div className="grid gap-4 max-w-md">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Name</label>
            <input type="text" value={user?.name || ''} readOnly className="w-full bg-[#111111] border border-[#27272a] rounded-lg px-4 py-2 text-white outline-none opacity-70" />
          </div>
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Email</label>
            <input type="email" value={user?.email || ''} readOnly className="w-full bg-[#111111] border border-[#27272a] rounded-lg px-4 py-2 text-white outline-none opacity-70" />
          </div>
        </div>
      </div>

      <div className="bg-red-950/20 border border-red-900/50 rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-900/20 rounded-lg text-red-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-red-500 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-400/80 mb-4 max-w-2xl">
              Permanently delete your account and all associated data. This action cannot be undone. All positions must be liquidated before deletion can proceed.
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {isDeleting ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
