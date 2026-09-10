'use client';

import { useState, useTransition } from 'react';
import { 
  ArrowLeftRight, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  Plus,
  Search,
  Coins,
  User,
  Calendar,
  Shield
} from 'lucide-react';
import { proposeTradeAction, acceptTradeAction, rejectTradeAction, cancelTradeAction, getTradesForClub } from './actions';
import { RosterItem } from '@/lib/session';
import { SAMPLE_PLAYERS } from '@/lib/data/players';

interface TradeInboxProps {
  roster: RosterItem[];
  club: any;
}

interface Trade {
  id: string;
  proposer_club_id: string;
  recipient_club_id: string;
  offered_player_ids: string[];
  requested_player_ids: string[];
  cash_adjustment: number;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function TradeInbox({ roster, club }: TradeInboxProps) {
  const [incoming, setIncoming] = useState<Trade[]>([]);
  const [outgoing, setOutgoing] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Propose modal state
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedOffered, setSelectedOffered] = useState<Set<string>>(new Set());
  const [selectedRequested, setSelectedRequested] = useState<Set<string>>(new Set());
  const [cashAdjustment, setCashAdjustment] = useState<number>(0);

  // Load trades on mount
  useState(() => {
    startTransition(async () => {
      const trades = await getTradesForClub();
      setIncoming(trades.incoming);
      setOutgoing(trades.outgoing);
    });
  });

  const handleAccept = (tradeId: string) => {
    startTransition(async () => {
      const res = await acceptTradeAction(tradeId);
      if (res.success) {
        setNotification({ type: 'success', message: 'Trade accepted successfully!' });
        const trades = await getTradesForClub();
        setIncoming(trades.incoming);
        setOutgoing(trades.outgoing);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to accept trade' });
      }
    });
  };

  const handleReject = (tradeId: string) => {
    startTransition(async () => {
      const res = await rejectTradeAction(tradeId);
      if (res.success) {
        setNotification({ type: 'success', message: 'Trade rejected.' });
        const trades = await getTradesForClub();
        setIncoming(trades.incoming);
        setOutgoing(trades.outgoing);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to reject trade' });
      }
    });
  };

  const handleCancel = (tradeId: string) => {
    startTransition(async () => {
      const res = await cancelTradeAction(tradeId);
      if (res.success) {
        setNotification({ type: 'success', message: 'Trade cancelled.' });
        const trades = await getTradesForClub();
        setIncoming(trades.incoming);
        setOutgoing(trades.outgoing);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to cancel trade' });
      }
    });
  };

  const handlePropose = () => {
    if (!selectedRecipient) {
      setNotification({ type: 'error', message: 'Please select a recipient club.' });
      return;
    }
    if (selectedOffered.size === 0 && selectedRequested.size === 0) {
      setNotification({ type: 'error', message: 'Please select at least one player to offer or request.' });
      return;
    }

    startTransition(async () => {
      const res = await proposeTradeAction(
        selectedRecipient,
        Array.from(selectedOffered),
        Array.from(selectedRequested),
        cashAdjustment
      );
      if (res.success) {
        setNotification({ type: 'success', message: 'Trade proposal sent!' });
        setShowProposeModal(false);
        setSelectedRecipient('');
        setSelectedOffered(new Set());
        setSelectedRequested(new Set());
        setCashAdjustment(0);
        const trades = await getTradesForClub();
        setOutgoing(trades.outgoing);
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to propose trade' });
      }
    });
  };

  const toggleOffered = (playerId: string) => {
    setSelectedOffered(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const toggleRequested = (playerId: string) => {
    setSelectedRequested(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const getPlayerById = (id: string) => {
    return SAMPLE_PLAYERS.find(p => p.id === id) || roster.find(r => r.player_id === id)?.player;
  };

  const formatCurrency = (val: number) => {
    return `£${Math.abs(val).toLocaleString('en-GB')}`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff <= 0) return 'Expired';
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
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

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#161F30] p-1 rounded-lg border border-[#22304A] w-fit">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'incoming'
              ? 'bg-[#00FF87] text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Incoming ({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'outgoing'
              ? 'bg-[#00FF87] text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Outgoing ({outgoing.length})
        </button>
      </div>

      {/* Propose Button */}
      <button
        onClick={() => setShowProposeModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00FF87] text-black font-bold text-xs hover:bg-[#00e67a] transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Propose New Trade</span>
      </button>

      {/* Trade List */}
      <div className="space-y-4">
        {(activeTab === 'incoming' ? incoming : outgoing).length === 0 ? (
          <div className="p-8 rounded-xl bg-[#111827] border border-[#22304A] text-center">
            <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {activeTab === 'incoming' 
                ? 'No incoming trade proposals.' 
                : 'No outgoing trade proposals.'}
            </p>
          </div>
        ) : (
          (activeTab === 'incoming' ? incoming : outgoing).map((trade) => {
            const isRecipient = trade.recipient_club_id === club.id;
            const offeredPlayers = trade.offered_player_ids.map(getPlayerById).filter(Boolean);
            const requestedPlayers = trade.requested_player_ids.map(getPlayerById).filter(Boolean);
            
            return (
              <div
                key={trade.id}
                className="p-5 rounded-xl bg-[#111827] border border-[#22304A] hover:border-[#22304A] transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Trade Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(trade.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getTimeRemaining(trade.expires_at)}</span>
                      </div>
                    </div>

                    {/* Player Swap */}
                    <div className="flex items-center gap-4">
                      {/* Offered */}
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                          {isRecipient ? 'They Offer' : 'You Offer'}
                        </p>
                        <div className="space-y-1">
                          {offeredPlayers.map((player: any) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 text-xs bg-[#0A0E17] px-2 py-1 rounded border border-[#22304A]"
                            >
                              <span className="font-medium text-white">{player.name}</span>
                              <span className="text-slate-400">{player.position}</span>
                              <span className="text-[#00FF87] font-mono">
                                £{(player.current_market_value / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowLeftRight className="w-5 h-5 text-slate-600 flex-shrink-0" />

                      {/* Requested */}
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                          {isRecipient ? 'They Request' : 'You Request'}
                        </p>
                        <div className="space-y-1">
                          {requestedPlayers.map((player: any) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 text-xs bg-[#0A0E17] px-2 py-1 rounded border border-[#22304A]"
                            >
                              <span className="font-medium text-white">{player.name}</span>
                              <span className="text-slate-400">{player.position}</span>
                              <span className="text-[#00FF87] font-mono">
                                £{(player.current_market_value / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cash Adjustment */}
                    {trade.cash_adjustment !== 0 && (
                      <div className={`flex items-center gap-2 text-xs font-mono ${
                        isRecipient ? (trade.cash_adjustment > 0 ? 'text-[#00FF87]' : 'text-rose-400')
                                   : (trade.cash_adjustment < 0 ? 'text-[#00FF87]' : 'text-rose-400')
                      }`}>
                        <Coins className="w-3.5 h-3.5" />
                        <span>
                          {isRecipient 
                            ? (trade.cash_adjustment > 0 ? 'You receive' : 'You pay')
                            : (trade.cash_adjustment < 0 ? 'You receive' : 'You pay')
                          } {formatCurrency(trade.cash_adjustment)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isRecipient ? (
                      <>
                        <button
                          onClick={() => handleAccept(trade.id)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00FF87] text-black font-bold text-xs hover:bg-[#00e67a] transition-all disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleReject(trade.id)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161F30] hover:bg-rose-500/10 hover:text-rose-400 border border-[#22304A] text-slate-300 text-xs transition-all disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(trade.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161F30] hover:bg-rose-500/10 hover:text-rose-400 border border-[#22304A] text-slate-300 text-xs transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Propose Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#22304A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#22304A]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Propose Trade</h2>
                <button
                  onClick={() => setShowProposeModal(false)}
                  className="p-2 rounded-lg hover:bg-[#22304A] text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Recipient Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Recipient Club ID
                </label>
                <input
                  type="text"
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  placeholder="Enter recipient club ID..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  In production, this would be a searchable dropdown of other clubs
                </p>
              </div>

              {/* Players to Offer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Players to Offer ({selectedOffered.size} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {roster.map((item) => {
                    const player = item.player;
                    const isSelected = selectedOffered.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleOffered(player.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                          isSelected
                            ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
                            : 'bg-[#0A0E17] border-[#22304A] text-slate-300 hover:border-[#22304A]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-slate-500">{player.position}</span>
                        </div>
                        <span className="font-mono">
                          £{(player.current_market_value / 1000000).toFixed(1)}M
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Players to Request */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Players to Request ({selectedRequested.size} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {SAMPLE_PLAYERS.slice(0, 20).map((player) => {
                    const isSelected = selectedRequested.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleRequested(player.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                          isSelected
                            ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
                            : 'bg-[#0A0E17] border-[#22304A] text-slate-300 hover:border-[#22304A]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-slate-500">{player.position}</span>
                          <span className="text-slate-500">{player.real_team}</span>
                        </div>
                        <span className="font-mono">
                          £{(player.current_market_value / 1000000).toFixed(1)}M
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  In production, this would show the recipient's actual roster
                </p>
              </div>

              {/* Cash Adjustment */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Cash Adjustment
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={cashAdjustment}
                    onChange={(e) => setCashAdjustment(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:border-[#00FF87] focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">Positive = you pay, Negative = they pay</span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handlePropose}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#00FF87] text-black font-bold text-sm hover:bg-[#00e67a] transition-all disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Send Trade Proposal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
