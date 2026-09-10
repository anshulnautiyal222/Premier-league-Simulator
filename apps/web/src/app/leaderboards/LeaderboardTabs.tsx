'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, Shield, Crown } from 'lucide-react';
import type { LeaderboardEntry } from './actions';

interface LeaderboardTabsProps {
  netWorth: LeaderboardEntry[];
  tradingRoi: LeaderboardEntry[];
  squadBattles: LeaderboardEntry[];
  currentClubId: string;
}

type TabType = 'netWorth' | 'tradingRoi' | 'squadBattles';

export default function LeaderboardTabs({ netWorth, tradingRoi, squadBattles, currentClubId }: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('netWorth');

  const tabs = [
    { id: 'netWorth' as TabType, label: 'Club Net Worth', icon: Trophy, data: netWorth },
    { id: 'tradingRoi' as TabType, label: 'Trading ROI', icon: TrendingUp, data: tradingRoi },
    { id: 'squadBattles' as TabType, label: 'Squad Battles', icon: Shield, data: squadBattles },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const entries = currentTab?.data || [];

  const formatCurrency = (val: number) => {
    return `£${(val / 1000000).toFixed(1)}M`;
  };

  const formatPercent = (val: number) => {
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-[#FFD700]" />;
    if (rank === 2) return <span className="text-slate-300 font-bold">2</span>;
    if (rank === 3) return <span className="text-amber-600 font-bold">3</span>;
    return <span className="text-slate-500 font-mono">{rank}</span>;
  };

  const getValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'netWorth':
        return formatCurrency(entry.net_worth);
      case 'tradingRoi':
        return formatPercent(entry.trading_roi);
      case 'squadBattles':
        return formatCurrency(entry.squad_battle_value);
    }
  };

  const getValueColor = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'netWorth':
        return 'text-white';
      case 'tradingRoi':
        return entry.trading_roi >= 0 ? 'text-[#00FF87]' : 'text-rose-400';
      case 'squadBattles':
        return 'text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-[#161F30] p-1 rounded-lg border border-[#22304A]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00FF87] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[#22304A] bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#22304A] bg-[#161F30]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Club</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {activeTab === 'netWorth' ? 'Net Worth' : activeTab === 'tradingRoi' ? 'ROI' : 'Squad Value'}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                    No clubs ranked yet
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.club_id}
                    className={`border-b border-[#22304A] hover:bg-[#161F30] transition-colors ${
                      entry.is_current_user ? 'bg-[#00FF87]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border"
                          style={{
                            backgroundColor: entry.colors.secondary,
                            borderColor: entry.colors.primary,
                            color: entry.colors.primary,
                          }}
                        >
                          {entry.club_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{entry.club_name}</p>
                          {entry.is_current_user && (
                            <p className="text-[10px] text-[#00FF87]">You</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-bold text-sm ${getValueColor(entry)}`}>
                        {getValue(entry)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {entries.length > 0 && (
          <div className="px-4 py-3 border-t border-[#22304A] bg-[#161F30] flex items-center justify-between text-xs text-slate-400">
            <span>Showing top {entries.length} clubs</span>
            <span>Global rankings</span>
          </div>
        )}
      </div>
    </div>
  );
}
