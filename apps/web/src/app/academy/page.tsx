import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { getCurrentUser, getClubForUser, getClubRoster } from '@/lib/session';
import {
  clampFacilityLevel,
  academyPackPrice,
  academyOdds,
  scoutingEarlyMinutes,
  stadiumWeeklyIncome,
  top11SquadAppeal,
  isDividendDue,
  nextDividendAt,
  upgradeCost,
  RUMOR_PUBLIC_EMBARGO_MINUTES,
} from '@/lib/facilities';
import AcademyClient from './AcademyClient';
import {
  Building2,
  Coins,
  LogOut,
  Shield,
  Crown,
  Flame,
  Anchor,
  Target,
  Sparkles,
  TrendingUp,
  ArrowLeftRight,
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

export default async function AcademyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const club = await getClubForUser(user.id);
  if (!club) redirect('/found-club');

  const roster = await getClubRoster(club.id);
  const academyLevel = clampFacilityLevel(club.academy_level);
  const scoutingLevel = clampFacilityLevel(club.scouting_level);
  const stadiumLevel = clampFacilityLevel(club.stadium_level);

  const appeal = top11SquadAppeal(
    roster.map((r) => Number(r.player?.current_market_value || r.acquisition_price || 0))
  );

  const purseBalance = Number(club.virtual_purse_balance) || 0;
  const weeklyYield = stadiumWeeklyIncome(appeal, stadiumLevel);
  const colors = (club.colors as { primary?: string; secondary?: string }) || {
    primary: '#00FF87',
    secondary: '#0A0E17',
  };
  const BadgeIcon = BADGE_MAP[club.badge_url] || Shield;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border font-bold"
              style={{
                backgroundColor: colors.secondary || '#0A0E17',
                borderColor: colors.primary || '#00FF87',
                color: colors.primary || '#00FF87',
              }}
            >
              <BadgeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Club Facilities</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Academy · Scouting · Stadium
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/trades"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>P2P Trades</span>
            </Link>
            <div className="flex items-center gap-2 text-xs bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
              <strong className="text-[#00FF87] font-mono">£{purseBalance.toLocaleString('en-GB')}</strong>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-red-500/10 hover:text-red-400 border border-[#22304A] text-xs text-slate-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AcademyClient
          purseBalance={purseBalance}
          academyLevel={academyLevel}
          scoutingLevel={scoutingLevel}
          stadiumLevel={stadiumLevel}
          packPrice={academyPackPrice(academyLevel)}
          packListPrice={8_000_000}
          odds={academyOdds(academyLevel)}
          academyUpgradeCost={upgradeCost('academy', academyLevel)}
          scoutingUpgradeCost={upgradeCost('scouting', scoutingLevel)}
          stadiumUpgradeCost={upgradeCost('stadium', stadiumLevel)}
          earlyMinutes={scoutingEarlyMinutes(scoutingLevel)}
          embargoMinutes={RUMOR_PUBLIC_EMBARGO_MINUTES}
          weeklyYield={weeklyYield}
          top11Appeal={appeal}
          rosterCount={roster.length}
          dividendDue={isDividendDue(club.last_dividend_at)}
          nextDividendIso={nextDividendAt(club.last_dividend_at).toISOString()}
        />
      </main>
    </div>
  );
}
