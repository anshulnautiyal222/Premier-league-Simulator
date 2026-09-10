'use client';

import { useState, useTransition } from 'react';
import { joinLeagueByCodeAction } from './create/actions';
import { Loader2, Check, AlertCircle, X, Key } from 'lucide-react';

interface JoinLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinLeagueModal({ isOpen, onClose, onSuccess }: JoinLeagueModalProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inviteCode, setInviteCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setNotification({ type: 'error', message: 'Please enter an invite code.' });
      return;
    }

    startTransition(async () => {
      const res = await joinLeagueByCodeAction(inviteCode);
      if (res.success) {
        setNotification({ type: 'success', message: `Joined "${res.data.league_name}"!` });
        setTimeout(() => {
          setInviteCode('');
          setNotification(null);
          onClose();
          onSuccess();
        }, 1500);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to join league.' });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#22304A] rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-[#22304A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30">
                <Key className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h2 className="text-lg font-bold text-white">Join League</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#22304A] text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Notification */}
          {notification && (
            <div className={`p-3 rounded-lg border text-sm ${
              notification.type === 'success' 
                ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full px-4 py-3 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none font-mono uppercase"
                maxLength={6}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Enter the 6-character code from the league owner
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#38BDF8] text-black font-bold text-sm hover:bg-sky-400 transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Join League</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
