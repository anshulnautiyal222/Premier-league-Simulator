import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import { getLeagueLeaderboard } from '../../actions';
import { ArrowLeft, Users, Trophy, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeagueLeaderboardPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  const { league, entries, currentRank, error } = await getLeagueLeaderboard(params.id);

  if (error || !league) {
    redirect('/leaderboards');
  }

  const leagueData = league as any;

  const formatCurrency = (val: number) => {
    return `£${(val / 1000000).toFixed(1)}M`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
      {/* Header */}
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/leaderboards"
              className="p-2 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-bold text-white tracking-tight">{league.name}</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Private League
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentRank && (
              <div className="flex items-center gap-2 text-xs bg-[#FFD700]/10 px-3 py-1.5 rounded-full border border-[#FFD700]/30">
                <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="text-slate-300">Your Rank:</span>
                <strong className="text-[#FFD700] font-mono">#{currentRank}</strong>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* League Info */}
        <div className="p-6 rounded-2xl border bg-[#111827] border-[#22304A]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{leagueData.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {leagueData.member_club_ids?.length || 0} members
                </span>
                <span>Budget Cap: {formatCurrency(leagueData.budget_cap)}</span>
                <span>Salary Cap: {formatCurrency(leagueData.salary_cap)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Invite Code</p>
                <p className="font-mono text-[#38BDF8] font-bold">{leagueData.invite_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-[#22304A] bg-[#111827] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#22304A] bg-[#161F30]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Club</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                      No members yet
                    </td>
                  </tr>
                ) : (
                  entries.map((entry: any) => (
                    <tr
                      key={entry.club_id}
                      className={`border-b border-[#22304A] hover:bg-[#161F30] transition-colors ${
                        entry.is_current_user ? 'bg-[#00FF87]/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-lg">{getRankIcon(entry.rank)}</span>
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
                        <span className="font-mono font-bold text-sm text-white">
                          {formatCurrency(entry.net_worth)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
