import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import { getVotedRumorIds, getScoutedRumors } from './actions';
import RumorDeck from './RumorDeck';
import {
  Flame,
  Coins,
  TrendingUp,
  ArrowLeftRight,
  Building2,
  LogOut,
  Shield,
  Crown,
  Anchor,
  Target,
  Sparkles,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

const BADGE_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  preset_lion: Crown,
  preset_shield: Shield,
  preset_flame: Flame,
  preset_anchor: Anchor,
  preset_cannon: Target,
  preset_star: Sparkles,
};

export default async function RumorsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  const { rumors: rumorsList, earlyMinutes } = await getScoutedRumors();
  const votedRumorIds = await getVotedRumorIds();
  const purseBalance = Number(club.virtual_purse_balance) || 100000000;

  const colors = (club.colors as { primary?: string; secondary?: string }) || {
    primary: '#00FF87',
    secondary: '#0A0E17',
  };

  const BadgeIcon = BADGE_MAP[club.badge_url] || Shield;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 pb-16">
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
              <span className="font-bold text-white tracking-tight">{club.club_name}</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Sporting Director Terminal · Scouting +{earlyMinutes}m
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/academy"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Facilities</span>
            </Link>

            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Squad</span>
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

      <div className="bg-[#0D1524] border-b border-[#22304A] py-2 px-4 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase shrink-0">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>BREAKING RADAR</span>
          </div>

          <div className="relative overflow-hidden w-full h-5">
            <div className="absolute whitespace-nowrap text-xs text-slate-300 font-mono animate-[marquee_25s_linear_infinite] flex items-center gap-8">
              {rumorsList.map((r) => (
                <span key={r.id} className="flex items-center gap-2">
                  {r.early_access && (
                    <span className="text-[#38BDF8] font-bold">[EARLY]</span>
                  )}
                  <span className="text-[#00FF87] font-bold">[{r.tier_label.split('•')[0].trim()}]</span>
                  <span>{r.source_name}:</span>
                  <span className="text-white font-semibold">{r.headline}</span>
                  <span className="text-slate-500">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <RumorDeck
          initialRumors={rumorsList}
          votedRumorIds={votedRumorIds}
          clubPurse={purseBalance}
        />
      </main>
    </div>
  );
}
