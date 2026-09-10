import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import { getLeagueLeaderboard } from './actions';
import LeaderboardTabs from './LeaderboardTabs';
import LeaderboardsClient from './LeaderboardsClient';
import { 
  Trophy, 
  ArrowLeft,
  Gavel,
  Shield,
  Coins
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

  const leagueData = await getLeagueLeaderboard('TOTAL_POINTS');

  return (
    <LeaderboardsClient>
      <div className="min-h-screen bg-[#0A0E17] text-slate-100 pb-16">
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
                <span className="font-bold text-white tracking-tight">League Standings</span>
                <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                  {leagueData.leagueName} · Isolated 16-Club Universe
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/draft"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF87] hover:bg-[#00e67a] text-black font-bold text-xs transition-all shadow-sm"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Draft Room</span>
              </Link>

              {leagueData.currentClubRank && (
                <div className="flex items-center gap-2 text-xs bg-[#FFD700]/10 px-3 py-1.5 rounded-full border border-[#FFD700]/30">
                  <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span className="text-slate-300">Your Rank:</span>
                  <strong className="text-[#FFD700] font-mono">#{leagueData.currentClubRank}</strong>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Welcome Banner */}
          <div className="p-6 sm:p-8 rounded-2xl border bg-[#111827] border-[#22304A]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>SPEC v2 Multi-Attribute Standings</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {leagueData.leagueName} Leaderboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
                  Track real Premier League matchday points, 5-gameweek form, star asset contributions, and draft credit efficiency across your isolated 16-club universe.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/draft"
                  className="px-5 py-3 rounded-xl bg-[#00FF87] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#00e67a] active:scale-95 transition-all shadow-md shadow-[#00FF87]/10"
                >
                  <Gavel className="w-4 h-4" />
                  <span>Open Draft Room</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Multi-Attribute Standings Table */}
          <LeaderboardTabs 
            initialEntries={leagueData.entries}
            currentClubId={club.id}
            currentGameweek={leagueData.currentGameweek}
            leagueName={leagueData.leagueName}
          />
        </main>
      </div>
    </LeaderboardsClient>
  );
}
