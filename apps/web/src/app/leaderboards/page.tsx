import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import { getGlobalLeaderboards, getUserLeagues, type LeaderboardEntry } from './actions';
import LeaderboardTabs from './LeaderboardTabs';
import LeaderboardsClient from './LeaderboardsClient';
import { 
  Trophy, 
  TrendingUp, 
  Shield, 
  ArrowLeft,
  Users,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderboardsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  const { netWorth, tradingRoi, squadBattles, currentRank } = await getGlobalLeaderboards(100);
  const { owned, member } = await getUserLeagues();

  return (
    <LeaderboardsClient>
      <div className="min-h-screen bg-[#0A0E17] text-slate-100">
        {/* Header */}
        <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <span className="font-bold text-white tracking-tight">Leaderboards</span>
                <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                  Global Rankings & Private Leagues
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
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome Banner */}
          <div className="p-6 sm:p-8 rounded-2xl border bg-[#111827] border-[#22304A]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] mb-3">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Global Rankings</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Club Leaderboards
                </h1>
                <p className="text-sm text-slate-400 mt-2">
                  Compete with managers worldwide across Net Worth, Trading ROI, and Squad Battles.
                </p>
              </div>
            </div>
          </div>

          {/* Leaderboard Tabs */}
          <LeaderboardTabs 
            netWorth={netWorth}
            tradingRoi={tradingRoi}
            squadBattles={squadBattles}
            currentClubId={club.id}
          />

          {/* Private Leagues Section */}
          <div className="p-6 sm:p-8 rounded-2xl border bg-[#111827] border-[#22304A]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#161F30] border border-[#22304A]">
                  <Users className="w-5 h-5 text-[#38BDF8]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Private Leagues</h2>
                  <p className="text-xs text-slate-400">Create custom leagues with friends</p>
                </div>
              </div>
              <Link
                href="/leaderboards/create"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#38BDF8] text-black font-bold text-xs hover:bg-sky-400 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create League</span>
              </Link>
            </div>

            {owned.length === 0 && member.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#0A0E17] border border-[#22304A] text-center">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No private leagues yet</p>
                <p className="text-xs text-slate-500 mt-1">Create a league to compete with friends</p>
              </div>
            ) : (
              <div className="space-y-4">
                {owned.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Leagues</p>
                    <div className="space-y-2">
                      {owned.map((league: any) => (
                        <Link
                          key={league.id}
                          href={`/leaderboards/league/${league.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-[#0A0E17] border border-[#22304A] hover:border-[#38BDF8]/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-white">{league.name}</p>
                            <p className="text-xs text-slate-400">{league.member_club_ids?.length || 0} members</p>
                          </div>
                          <div className="text-xs font-mono text-[#38BDF8]">
                            {league.invite_code}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {member.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Member Leagues</p>
                    <div className="space-y-2">
                      {member.map((league: any) => (
                        <Link
                          key={league.id}
                          href={`/leaderboards/league/${league.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-[#0A0E17] border border-[#22304A] hover:border-[#38BDF8]/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-white">{league.name}</p>
                            <p className="text-xs text-slate-400">{league.member_club_ids?.length || 0} members</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </LeaderboardsClient>
  );
}
