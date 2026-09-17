'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  ShieldAlert, 
  Users, 
  X, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Trophy
} from 'lucide-react';
import type { LeagueWorld, DraftBid } from '@gafferdex/shared-types';
import type { SeedPlayer } from '@/lib/data/players';
import type { RosterItem } from '@/lib/session';
import { submitDraftBidAction, cancelDraftBidAction, resolveDraftAction } from './actions';

interface DraftRoomClientProps {
  league: LeagueWorld;
  club: {
    id: string;
    name: string;
    draftCredits: number;
    remainingCredits: number;
    committedCredits: number;
  };
  bids: DraftBid[];
  roster: RosterItem[];
  availablePlayers: SeedPlayer[];
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FWD: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function DraftRoomClient({
  league,
  club,
  bids,
  roster,
  availablePlayers,
}: DraftRoomClientProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<SeedPlayer | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(25);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pendingBids = bids.filter((b) => b.status === 'PENDING');
  const wonBids = bids.filter((b) => b.status === 'WON');

  const filteredPlayers = availablePlayers.filter((player) => {
    const matchesPos = selectedPosition === 'ALL' || player.position === selectedPosition;
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.real_team.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const handleOpenBid = (player: SeedPlayer) => {
    setSelectedPlayer(player);
    const existing = pendingBids.find((b) => b.playerId === player.id);
    setBidAmount(existing ? existing.bidAmount : 25);
  };

  const handleSubmitBid = () => {
    if (!selectedPlayer) return;
    setNotification(null);
    startTransition(async () => {
      const res = await submitDraftBidAction(selectedPlayer.id, bidAmount);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({ type: 'success', message: res.message || 'Bid submitted!' });
        setSelectedPlayer(null);
      }
    });
  };

  const handleCancelBid = (bidId: string) => {
    setNotification(null);
    startTransition(async () => {
      const res = await cancelDraftBidAction(bidId);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({ type: 'success', message: res.message || 'Bid cancelled.' });
      }
    });
  };

  const handleResolveDraft = () => {
    if (!confirm('Resolve the sealed-bid draft round? Highest bids will win players, and squads under 11 will be auto-filled.')) {
      return;
    }
    setNotification(null);
    startTransition(async () => {
      const res = await resolveDraftAction(league.id);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({
          type: 'success',
          message: res.message || 'Draft window successfully resolved!',
        });
      }
    });
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-[#00FF87]" />
              <span className="font-bold text-white text-sm">Sealed-Bid Draft Room</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30">
                {league.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/trades"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-300 transition-colors"
            >
              P2P Trades
            </Link>
            <Link
              href="/leaderboards"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-300 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Leaderboard</span>
            </Link>

            <div className="flex items-center gap-2 text-xs bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#00FF87]" />
              <span className="text-slate-400">Draft Credits:</span>
              <strong className="text-[#00FF87] font-mono">{club.remainingCredits} / {club.draftCredits}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
              notification.type === 'success'
                ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* League & Draft Banner */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              {league.name} · 16-Club Universe
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sealed-Bid Blind Auction Draft
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Submit sealed bids up to your 500 draft credit budget. When the draft closes, highest bids win. Any squad below 11 players is auto-filled with unowned players.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3 bg-[#161F30] rounded-xl border border-[#22304A] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Draft Deadline</span>
              </div>
              <div className="font-bold text-white font-mono text-xs">
                {new Date(league.draftDeadline).toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {league.status === 'DRAFT_ACTIVE' && (
              <button
                onClick={handleResolveDraft}
                disabled={isPending}
                className="px-5 py-3 rounded-xl bg-[#00FF87] hover:bg-[#00e67a] active:scale-95 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-[#00FF87]/10"
              >
                <Gavel className="w-4 h-4" />
                <span>{isPending ? 'Resolving...' : 'Resolve Draft Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Two Column Layout: Catalog on Left, Sealed Bids on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Catalog (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Position Filters */}
              <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-xl border border-[#22304A]">
                {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedPosition === pos
                        ? 'bg-[#00FF87] text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111827] border border-[#22304A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
                />
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPlayers.slice(0, 18).map((player) => {
                const activeBid = pendingBids.find((b) => b.playerId === player.id);

                return (
                  <div
                    key={player.id}
                    className="p-4 rounded-xl bg-[#111827] border border-[#22304A] hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                              POSITION_COLORS[player.position] || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {player.position}
                          </span>
                          <span className="text-xs text-slate-400">{player.real_team}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1">{player.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Base Val: £{(player.base_value / 1_000_000).toFixed(1)}M
                        </span>
                      </div>

                      {activeBid && (
                        <span className="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                          Bid: {activeBid.bidAmount} pts
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenBid(player)}
                      disabled={league.status !== 'DRAFT_ACTIVE'}
                      className="w-full py-2 rounded-lg bg-[#161F30] hover:bg-[#00FF87] hover:text-black border border-[#22304A] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>{activeBid ? 'Edit Sealed Bid' : 'Place Sealed Bid'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bids & Roster Status (1 Col) */}
          <div className="space-y-6">
            {/* Budget Meter */}
            <div className="p-5 rounded-2xl bg-[#111827] border border-[#22304A] space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#00FF87]" />
                Draft Credit Ledger
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Starting Allocation:</span>
                  <strong className="text-white">{club.draftCredits} credits</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Committed in Bids:</span>
                  <strong className="text-amber-400">-{club.committedCredits} credits</strong>
                </div>
                <div className="border-t border-[#22304A] pt-2 flex justify-between text-sm">
                  <span className="text-slate-300">Remaining to Bid:</span>
                  <strong className="text-[#00FF87] font-bold">{club.remainingCredits} credits</strong>
                </div>
              </div>
            </div>

            {/* My Active Sealed Bids */}
            <div className="p-5 rounded-2xl bg-[#111827] border border-[#22304A] space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#38BDF8]" />
                  Active Sealed Bids ({pendingBids.length})
                </h3>
              </div>

              {pendingBids.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No pending bids. Select players from the catalog to submit sealed bids.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingBids.map((b) => {
                    const p = availablePlayers.find((item) => item.id === b.playerId);

                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-[#161F30] border border-[#22304A] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{p?.name || 'Player'}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p?.position} · {p?.real_team}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00FF87]">
                            {b.bidAmount} pts
                          </span>
                          <button
                            onClick={() => handleCancelBid(b.id)}
                            disabled={isPending}
                            title="Cancel bid and refund credits"
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Won Players / Roster Status */}
            <div className="p-5 rounded-2xl bg-[#111827] border border-[#22304A] space-y-3 text-xs shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00FF87]" />
                Squad Progress ({roster.length} / 11 Min)
              </h3>
              <p className="text-slate-400 text-[11px]">
                {roster.length >= 11
                  ? 'Squad minimum met! You are ready for live gameweek scoring.'
                  : `You need ${11 - roster.length} more players to hit the 11-player minimum. Remaining spots will be auto-filled upon draft close.`}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bid Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                    POSITION_COLORS[selectedPlayer.position] || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {selectedPlayer.position}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedPlayer.name}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedPlayer.real_team} · Base Val: £{(selectedPlayer.base_value / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Sealed Bid Amount (Draft Credits)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={club.remainingCredits + (pendingBids.find((b) => b.playerId === selectedPlayer.id)?.bidAmount || 0)}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#00FF87]"
                />
                <span className="text-xs text-slate-400 font-mono shrink-0">credits</span>
              </div>
              <div className="flex gap-2">
                {[10, 25, 50, 100, 150].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setBidAmount(quick)}
                    className="px-2.5 py-1 rounded bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-[11px] font-mono text-slate-300 transition-colors"
                  >
                    +{quick}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBid}
                disabled={isPending || bidAmount <= 0}
                className="flex-1 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e67a] active:scale-95 text-black font-extrabold text-xs transition-all disabled:opacity-40"
              >
                {isPending ? 'Submitting...' : 'Confirm Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
