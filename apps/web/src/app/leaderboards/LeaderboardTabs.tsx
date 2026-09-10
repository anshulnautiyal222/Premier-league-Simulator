'use client';

import { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Flame, 
  Star, 
  Zap, 
  Crown, 
  Coins, 
  Award,
  ChevronUp,
  Shield
} from 'lucide-react';
import type { LeagueLeaderboardEntry, LeaderboardSortOption } from '@gafferdex/shared-types';

interface LeaderboardTabsProps {
  initialEntries: LeagueLeaderboardEntry[];
  currentClubId: string;
  currentGameweek: number;
  leagueName: string;
}

export default function LeaderboardTabs({
  initialEntries,
  currentClubId,
  currentGameweek,
  leagueName,
}: LeaderboardTabsProps) {
  const [activeSort, setActiveSort] = useState<LeaderboardSortOption>('TOTAL_POINTS');
  const [entries, setEntries] = useState<LeagueLeaderboardEntry[]>(initialEntries);

  const handleSortChange = (sortOption: LeaderboardSortOption) => {
    setActiveSort(sortOption);
    const sorted = [...entries];

    switch (sortOption) {
      case 'LAST_5_GW':
        sorted.sort((a, b) => b.last5Points - a.last5Points);
        break;
      case 'HIGH_GW':
        sorted.sort((a, b) => b.highestSingleGw - a.highestSingleGw);
        break;
      case 'TOP_SCORER':
        sorted.sort((a, b) => b.topScorerPoints - a.topScorerPoints);
        break;
      case 'DRAFT_EFFICIENCY':
        sorted.sort((a, b) => b.draftEfficiency - a.draftEfficiency);
        break;
      case 'TOTAL_POINTS':
      default:
        sorted.sort((a, b) => b.totalPoints - a.totalPoints);
        break;
    }

    sorted.forEach((e, idx) => {
      e.rank = idx + 1;
    });
    setEntries(sorted);
  };

  const tabs: Array<{ id: LeaderboardSortOption; label: string; icon: any }> = [
    { id: 'TOTAL_POINTS', label: 'Cumulative Points', icon: Trophy },
    { id: 'LAST_5_GW', label: 'Last 5 GWs Form', icon: Flame },
    { id: 'HIGH_GW', label: 'Single GW High', icon: Zap },
    { id: 'TOP_SCORER', label: 'Star Player', icon: Star },
    { id: 'DRAFT_EFFICIENCY', label: 'Draft Efficiency', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Rewards Podium Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-amber-500/5 border border-[#FFD700]/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              1st Place Reward
            </span>
            <div className="text-sm font-black text-white">+100 Champion Coins</div>
            <span className="text-[10px] text-slate-400">Exclusive League Champion Trophy</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-300/10 to-slate-500/5 border border-slate-400/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-300/20 flex items-center justify-center text-slate-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
              2nd Place Reward
            </span>
            <div className="text-sm font-black text-white">+50 Champion Coins</div>
            <span className="text-[10px] text-slate-400">Podium Finisher Flair</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-700/10 to-amber-900/5 border border-amber-600/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-700/20 flex items-center justify-center text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
              3rd Place Reward
            </span>
            <div className="text-sm font-black text-white">+25 Champion Coins</div>
            <span className="text-[10px] text-slate-400">Bronze Division Medal</span>
          </div>
        </div>
      </div>

      {/* Multi-Attribute Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#111827] p-1.5 rounded-2xl border border-[#22304A]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSort === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSortChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#00FF87] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#161F30]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl border border-[#22304A] bg-[#111827] overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#161F30] border-b border-[#22304A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00FF87]" />
            <h3 className="font-bold text-white text-sm">
              {leagueName} Standings (16 Clubs)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Gameweek {currentGameweek} of 38
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30]/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-[#22304A]">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">Pos</th>
                <th className="px-4 py-3.5">Club</th>
                <th className="px-4 py-3.5 text-right">Total Pts</th>
                <th className="px-4 py-3.5 text-right">Last 5 GWs</th>
                <th className="px-4 py-3.5 text-right">High GW</th>
                <th className="px-4 py-3.5">Star Asset</th>
                <th className="px-4 py-3.5 text-right">Draft Eff.</th>
                <th className="px-4 py-3.5 text-center">Prize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22304A]/60">
              {entries.map((entry) => {
                const isUser = entry.clubId === currentClubId;

                return (
                  <tr
                    key={entry.clubId}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-[#00FF87]/10 hover:bg-[#00FF87]/15'
                        : 'hover:bg-[#161F30]/60'
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center font-bold font-mono">
                      {entry.rank === 1 ? (
                        <Crown className="w-4 h-4 text-[#FFD700] mx-auto" />
                      ) : entry.rank <= 3 ? (
                        <span className="text-white font-black">{entry.rank}</span>
                      ) : (
                        <span className="text-slate-500">{entry.rank}</span>
                      )}
                    </td>

                    {/* Club */}
                    <td className="px-4 py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-black border border-white/20"
                          style={{ backgroundColor: entry.primaryColor }}
                        >
                          {entry.clubName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{entry.clubName}</span>
                            {isUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#00FF87] text-black">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Points */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-white text-sm">
                      {entry.totalPoints}
                    </td>

                    {/* Last 5 GWs */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                      {entry.last5Points} pts
                    </td>

                    {/* Highest Single GW */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                      {entry.highestSingleGw} pts
                    </td>

                    {/* Star Player */}
                    <td className="px-4 py-3.5">
                      <div className="text-white font-medium">{entry.topScorerName}</div>
                      <div className="text-[10px] text-[#00FF87] font-mono">
                        {entry.topScorerPoints} pts
                      </div>
                    </td>

                    {/* Draft Efficiency */}
                    <td className="px-4 py-3.5 text-right font-mono">
                      <span className="text-slate-300 font-semibold">
                        {entry.draftEfficiency}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">pts/cr</span>
                    </td>

                    {/* Prize */}
                    <td className="px-4 py-3.5 text-center">
                      {entry.championCoins > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30">
                          <Coins className="w-3 h-3" />
                          +{entry.championCoins}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
