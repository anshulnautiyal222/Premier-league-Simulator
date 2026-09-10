import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { getCurrentUser, getClubForUser, getClubRoster } from '@/lib/session';
import RosterTable from './RosterTable';
import { 
  Coins, 
  TrendingUp, 
  Building2, 
  LogOut, 
  Shield,
  Crown,
  Flame,
  Anchor,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Trophy,
  Gavel
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const BADGE_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  preset_lion: Crown,
  preset_shield: Shield,
  preset_flame: Flame,
  preset_anchor: Anchor,
  preset_cannon: Target,
  preset_star: Sparkles,
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  // Fetch full active roster with player details
  const rosterItems = await getClubRoster(club.id);

  const roster = rosterItems.map((entry) => ({
    id: entry.id,
    playerId: entry.player_id,
    name: entry.player?.name || 'Player',
    realTeam: entry.player?.real_team || 'Premier League',
    position: entry.player?.position || 'MID',
    acquisitionPrice: entry.acquisition_price || 0,
    currentMarketValue: entry.player?.current_market_value || entry.acquisition_price || 0,
    formScore: entry.player?.form_score || 6.5,
    injuryStatus: entry.player?.injury_status || 'fit',
    inStartingXi: Boolean(entry.in_starting_xi),
  }));

  const colors = (club.colors as { primary?: string; secondary?: string }) || {
    primary: '#00FF87',
    secondary: '#0A0E17',
  };

  const BadgeIcon = BADGE_MAP[club.badge_url] || Shield;

  const calculatedSquadValue = roster.reduce((acc, item) => acc + item.currentMarketValue, 0);
  const purseBalance = Number(club.virtual_purse_balance) || 100000000;
  const netWorth = purseBalance + calculatedSquadValue;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center border font-bold"
              style={{
                backgroundColor: colors.secondary || '#0A0E17',
                borderColor: colors.primary || '#00FF87',
                color: colors.primary || '#00FF87'
              }}
            >
              <BadgeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">{club.club_name}</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                {club.home_ground_name || 'Home Ground'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/academy"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-[#00FF87]" />
              <span>Facilities</span>
            </Link>

            <Link
              href="/rumors"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all shadow-sm"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Rumor Terminal</span>
            </Link>

            <Link
              href="/trades"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8] font-bold text-xs transition-all shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>P2P Trades</span>
            </Link>

            <Link
              href="/draft"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF87] hover:bg-[#00e67a] text-black font-bold text-xs transition-all shadow-sm"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Draft Room</span>
            </Link>

            <Link
              href="/leaderboards"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] font-bold text-xs transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Standings</span>
            </Link>



            <div className="flex items-center gap-2 text-xs bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-slate-400">Purse:</span>
              <strong className="text-[#00FF87] font-mono">
                £{purseBalance.toLocaleString('en-GB')}
              </strong>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-red-500/10 hover:text-red-400 border border-[#22304A] text-xs text-slate-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div 
          className="p-6 sm:p-8 rounded-2xl border relative overflow-hidden bg-[#111827] border-[#22304A]"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] mb-3">
                <Shield className="w-3 h-3 text-[#38BDF8]" />
                League World · 16-Club Universe
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {club.club_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Home Ground: <strong className="text-slate-200">{club.home_ground_name || 'Home Ground'}</strong> • Manager: <strong className="text-slate-200">{user.email}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/draft"
                className="px-5 py-3 rounded-xl bg-[#00FF87] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#00e67a] active:scale-95 transition-all shadow-md shadow-[#00FF87]/10"
              >
                <Gavel className="w-4 h-4" />
                <span>Sealed-Bid Draft</span>
              </Link>
              <Link
                href="/trades"
                className="px-5 py-3 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-white font-bold text-xs flex items-center gap-2 transition-all"
              >
                <span>P2P Transfers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-[#161F30] border border-[#22304A]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Liquid Purse (Funds)</span>
              <Coins className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#00FF87]">
              £{purseBalance.toLocaleString('en-GB')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Available cash for player signings
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#161F30] border border-[#22304A]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Squad Market Valuation</span>
              <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              £{calculatedSquadValue.toLocaleString('en-GB')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {roster.length} active player cards held
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#161F30] border border-[#22304A]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Total Club Net Worth</span>
              <Crown className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#FFD700]">
              £{netWorth.toLocaleString('en-GB')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Purse + Squad Market Value
            </div>
          </div>
        </div>

        {/* Active Squad Roster Section */}
        <RosterTable roster={roster} purseBalance={purseBalance} />

        {/* Facilities Status */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A]">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-[#00FF87]" />
            <Link href="/academy" className="hover:text-[#00FF87] transition-colors">
              Club Facilities & Passive Yields
            </Link>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/academy" className="p-4 rounded-xl bg-[#0A0E17] border border-[#22304A] hover:border-[#00FF87]/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-white">Youth Academy</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#161F30] text-[#00FF87] border border-[#22304A]">
                  Tier {club.academy_level || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Discounted rookie token packs</p>
            </Link>

            <Link href="/academy" className="p-4 rounded-xl bg-[#0A0E17] border border-[#22304A] hover:border-[#38BDF8]/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-white">Scouting Radar</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#161F30] text-[#38BDF8] border border-[#22304A]">
                  Tier {club.scouting_level || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Early rumor_feed access vs public embargo</p>
            </Link>

            <Link href="/academy" className="p-4 rounded-xl bg-[#0A0E17] border border-[#22304A] hover:border-[#FFD700]/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-white">Commercial Stadium</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#161F30] text-[#FFD700] border border-[#22304A]">
                  Tier {club.stadium_level || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Weekly purse yield from top-11 appeal</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
