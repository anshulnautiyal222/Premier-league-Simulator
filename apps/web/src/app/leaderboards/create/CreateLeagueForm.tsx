'use client';

import { useState, useTransition } from 'react';
import { createLeagueAction } from './actions';
import { Loader2, Check, AlertCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateLeagueFormProps {
  club: any;
}

export default function CreateLeagueForm({ club }: CreateLeagueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    budgetCap: 150000000,
    salaryCap: 500000000,
    maxMembers: 20,
    isPublic: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setNotification({ type: 'error', message: 'League name is required.' });
      return;
    }

    startTransition(async () => {
      const res = await createLeagueAction(formData);
      if (res.success) {
        setNotification({ type: 'success', message: 'League created successfully!' });
        setTimeout(() => {
          router.push('/leaderboards');
        }, 1000);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to create league.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            League Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Friday Night Premier League"
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
            maxLength={100}
          />
        </div>

        {/* Budget Cap */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Starting Budget Cap (£)
          </label>
          <input
            type="number"
            value={formData.budgetCap}
            onChange={(e) => setFormData({ ...formData, budgetCap: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
            min={50000000}
            max={500000000}
            step={10000000}
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Default: £150M. Range: £50M - £500M
          </p>
        </div>

        {/* Salary Cap */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Maximum Squad Value Cap (£)
          </label>
          <input
            type="number"
            value={formData.salaryCap}
            onChange={(e) => setFormData({ ...formData, salaryCap: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
            min={100000000}
            max={1000000000}
            step={50000000}
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Default: £500M. Range: £100M - £1B
          </p>
        </div>

        {/* Max Members */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Maximum Members
          </label>
          <input
            type="number"
            value={formData.maxMembers}
            onChange={(e) => setFormData({ ...formData, maxMembers: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
            min={2}
            max={50}
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Range: 2 - 50 members
          </p>
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="w-4 h-4 rounded border-[#22304A] bg-[#0A0E17] text-[#00FF87] focus:ring-[#00FF87]"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-300">
            Make league publicly discoverable
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#38BDF8] text-black font-bold text-sm hover:bg-sky-400 transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          <span>Create League</span>
        </button>
      </form>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-[#161F30] border border-[#22304A]">
        <p className="text-xs text-slate-400">
          <strong className="text-white">After creation:</strong> You'll receive a unique 6-character invite code to share with friends. They can join using this code from the leaderboards page.
        </p>
      </div>
    </div>
  );
}
