'use client';

import { useState, useTransition, useMemo } from 'react';
import { buyPlayerAction } from './actions';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Check, 
  Coins, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Flame
} from 'lucide-react';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  real_team: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  base_value: number;
  current_market_value: number;
  form_score: number;
  injury_status: string;
  contract_months_remaining: number;
}

interface Club {
  id: string;
  club_name: string;
  virtual_purse_balance: number;
}

interface MarketClientProps {
  players: Player[];
  club: Club | null;
  ownedPlayerIds: string[];
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FWD: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const ITEMS_PER_PAGE = 8;

export default function MarketClient({ players, club, ownedPlayerIds }: MarketClientProps) {
  const [search, setSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'form_desc'>('value_desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const purseBalance = club ? Number(club.virtual_purse_balance) : 0;

  // Extract unique teams
  const teams = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => set.add(p.real_team));
    return Array.from(set).sort();
  }, [players]);

  // Filter & sort players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                              p.real_team.toLowerCase().includes(search.toLowerCase());
        const matchesPos = selectedPosition === 'ALL' || p.position === selectedPosition;
        const matchesTeam = selectedTeam === 'ALL' || p.real_team === selectedTeam;
        return matchesSearch && matchesPos && matchesTeam;
      })
      .sort((a, b) => {
        if (sortBy === 'value_desc') return b.current_market_value - a.current_market_value;
        if (sortBy === 'value_asc') return a.current_market_value - b.current_market_value;
        if (sortBy === 'form_desc') return b.form_score - a.form_score;
        return 0;
      });
  }, [players, search, selectedPosition, selectedTeam, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const handleBuy = (player: Player) => {
    setNotification(null);
    setBuyingId(player.id);

    startTransition(async () => {
      const res = await buyPlayerAction(player.id);
      setBuyingId(null);

      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({
          type: 'success',
          message: `Successfully signed ${player.name} for £${Number(player.current_market_value).toLocaleString('en-GB')}!`,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Purse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#22304A]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00FF87]" />
              Premier League Transfer Market
            </h1>
            <p className="text-xs text-slate-400">
              {club ? club.club_name : 'Guest'} • {filteredPlayers.length} players available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161F30] border border-[#22304A]">
            <Coins className="w-4 h-4 text-[#FFD700]" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-slate-400">Available Purse</div>
              <div className="text-base font-bold font-mono text-[#00FF87]">
                £{purseBalance.toLocaleString('en-GB')}
              </div>
            </div>
          </div>
          <Link
            href="/rumors"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all shadow-sm"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Rumor Terminal</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-white transition-colors"
          >
            My Squad
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[#161F30] border border-[#22304A]">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search player or team..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
          />
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedPosition}
            onChange={(e) => {
              setSelectedPosition(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-xs text-white focus:outline-none focus:border-[#00FF87]"
          >
            <option value="ALL">All Positions</option>
            <option value="GK">Goalkeepers (GK)</option>
            <option value="DEF">Defenders (DEF)</option>
            <option value="MID">Midfielders (MID)</option>
            <option value="FWD">Forwards (FWD)</option>
          </select>
        </div>

        {/* Real Team Filter */}
        <div>
          <select
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-xs text-white focus:outline-none focus:border-[#00FF87]"
          >
            <option value="ALL">All Premier League Teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-xs text-white focus:outline-none focus:border-[#00FF87]"
          >
            <option value="value_desc">Market Value: High to Low</option>
            <option value="value_asc">Market Value: Low to High</option>
            <option value="form_desc">Match Form: Highest First</option>
          </select>
        </div>
      </div>

      {/* Players Table */}
      <div className="rounded-xl border border-[#22304A] bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#22304A]">
              <tr>
                <th className="px-4 py-3.5">Player</th>
                <th className="px-4 py-3.5">Pos</th>
                <th className="px-4 py-3.5">Club</th>
                <th className="px-4 py-3.5">Form</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Current Market Value</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22304A]/60">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No players found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player) => {
                  const isOwned = ownedPlayerIds.includes(player.id);
                  const canAfford = purseBalance >= Number(player.current_market_value);
                  const isBuying = buyingId === player.id;

                  return (
                    <tr 
                      key={player.id} 
                      className="hover:bg-[#161F30]/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#161F30] border border-[#22304A] flex items-center justify-center text-[10px] text-slate-300 font-mono">
                            {player.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              href={`/players/${player.id}`}
                              className="hover:text-[#00FF87] hover:underline flex items-center gap-1 group text-white"
                              title="View valuation history chart"
                            >
                              <span>{player.name}</span>
                              <TrendingUp className="w-3 h-3 text-slate-500 group-hover:text-[#00FF87] opacity-60 group-hover:opacity-100 transition-all" />
                            </Link>
                            <div className="text-[10px] text-slate-400 font-normal font-mono">
                              {player.contract_months_remaining}m contract
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${POSITION_COLORS[player.position] || 'bg-slate-800 text-slate-300'}`}>
                          {player.position}
                        </span>
                      </td>

                      {/* Real Club */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {player.real_team}
                      </td>

                      {/* Form Score */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-200">
                          {Number(player.form_score).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/10</span>
                      </td>

                      {/* Injury Status */}
                      <td className="px-4 py-3.5">
                        {player.injury_status === 'fit' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#00FF87]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]" />
                            Fit
                          </span>
                        ) : player.injury_status === 'minor_knock' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Knock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Injured
                          </span>
                        )}
                      </td>

                      {/* Market Value */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white text-sm">
                        £{Number(player.current_market_value).toLocaleString('en-GB')}
                      </td>

                      {/* Buy Action & Chart */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/players/${player.id}`}
                            className="p-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-400 hover:text-[#00FF87] transition-colors"
                            title="View Chart"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </Link>

                          {isOwned ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/30 text-[11px] font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              In Squad
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBuy(player)}
                              disabled={!canAfford || isPending || isBuying}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                canAfford
                                  ? 'bg-[#00FF87] text-black hover:bg-[#00e67a] active:scale-95 shadow-sm'
                                  : 'bg-[#161F30] text-slate-500 border border-[#22304A] cursor-not-allowed'
                              }`}
                            >
                              {isBuying ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Signing...</span>
                                </>
                              ) : canAfford ? (
                                <span>Buy</span>
                              ) : (
                                <span>Low Funds</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#161F30] border-t border-[#22304A] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}
            </strong>{' '}
            of <strong className="text-white">{filteredPlayers.length}</strong> players
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#0A0E17] border border-[#22304A] hover:border-slate-500 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#0A0E17] border border-[#22304A] hover:border-slate-500 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
