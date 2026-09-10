import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Building2, 
  LogOut, 
  ExternalLink,
  Shield,
  Crown,
  Flame,
  Anchor,
  Target,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

const BADGE_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  preset_lion: Crown,
  preset_shield: Shield,
  preset_flame: Flame,
  preset_anchor: Anchor,
  preset_cannon: Target,
  preset_star: Sparkles,
};

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (clubError || !club) {
    redirect('/found-club');
  }

  // Count active roster players
  const { count: rosterCount } = await supabase
    .from('club_roster')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id);

  const colors = (club.colors as { primary?: string; secondary?: string }) || {
    primary: '#00FF87',
    secondary: '#0A0E17',
  };

  const BadgeIcon = BADGE_MAP[club.badge_url] || Shield;

  const purseBalance = Number(club.virtual_purse_balance) || 100000000;
  const squadValue = Number(club.total_squad_value) || 0;
  const netWorth = purseBalance + squadValue;

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
            <div className="hidden sm:flex items-center gap-2 text-xs bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-slate-400">Liquid Purse:</span>
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
                <span>Exit</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome & Financial Banner */}
        <div 
          className="p-8 rounded-2xl border relative overflow-hidden"
          style={{
            backgroundColor: '#111827',
            borderColor: '#22304A'
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
                Sporting Director Boardroom
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {club.club_name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Home Ground: <strong className="text-slate-200">{club.home_ground_name || 'Home Ground'}</strong> • Manager Account: <strong className="text-slate-200">{user.email}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/found-club"
                className="px-4 py-2 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
              >
                Edit Club Identity
              </Link>
            </div>
          </div>
        </div>

        {/* Financial Metrics Cards */}
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
              Available for open-market transfers
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#161F30] border border-[#22304A]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Squad Market Valuation</span>
              <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              £{squadValue.toLocaleString('en-GB')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {rosterCount || 0} active player contracts held
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
              Purse balance + squad market value
            </div>
          </div>
        </div>

        {/* Facilities & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facility Status */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A]">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[#00FF87]" />
              Club Infrastructure & Facility Tiers
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#22304A]">
                <div>
                  <div className="font-semibold text-xs text-white">Youth Academy</div>
                  <div className="text-[11px] text-slate-400">Yields discounted rookie wonderkids</div>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#161F30] text-[#00FF87] border border-[#22304A]">
                  Tier {club.academy_level || 1} / 5
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#22304A]">
                <div>
                  <div className="font-semibold text-xs text-white">Scouting Department</div>
                  <div className="text-[11px] text-slate-400">Unlocks early breaking rumor intel</div>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#161F30] text-[#38BDF8] border border-[#22304A]">
                  Tier {club.scouting_level || 1} / 5
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0E17] border border-[#22304A]">
                <div>
                  <div className="font-semibold text-xs text-white">Commercial Stadium</div>
                  <div className="text-[11px] text-slate-400">Generates weekly purse dividends</div>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#161F30] text-[#FFD700] border border-[#22304A]">
                  Tier {club.stadium_level || 1} / 5
                </span>
              </div>
            </div>
          </div>

          {/* Roster & Market Status */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#38BDF8]" />
                Squad Building Status
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Your club has <strong className="text-white">{rosterCount || 0}</strong> players registered. Premier League regulations require between 11 and 25 players to field an active matchday lineup.
              </p>

              <div className="p-4 rounded-xl bg-[#161F30] border border-[#22304A] text-xs text-slate-300 flex items-center justify-between">
                <span>Roster Requirement:</span>
                <span className="font-mono font-bold text-[#FFD700]">11 - 25 Players</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22304A]">
              <div className="text-xs text-slate-400 mb-2">Ready to make your first signing?</div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00FF87] hover:underline cursor-pointer">
                <span>Proceed to Transfer Market (Coming in next milestone)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
