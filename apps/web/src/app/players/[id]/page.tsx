import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getClubForUser, getClubRoster } from '@/lib/session';
import { SAMPLE_PLAYERS, SeedPlayer } from '@/lib/data/players';
import { fetchPriceHistoryAction } from '../actions';
import PlayerPriceChart from './PlayerPriceChart';
import { 
  ArrowLeft, 
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Coins, 
  TrendingUp, 
  Shield, 
  HeartPulse, 
  Clock, 
  Star, 
  Flame, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PlayerPageProps {
  params: { id: string };
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FWD: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const INJURY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  fit: { label: 'MATCH FIT', color: 'text-[#00FF87]', bg: 'bg-[#00FF87]/15 border-[#00FF87]/30' },
  minor_knock: { label: 'MINOR KNOCK', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  severe_injury: { label: 'SEVERE INJURY', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
};

const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000';

export default async function PlayerDetailPage({ params }: PlayerPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  // 1. Resolve player from Supabase or SAMPLE_PLAYERS
  let player: SeedPlayer | null = null;
  const supabase = createClient();

  try {
    const { data: dbPlayer, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (!error && dbPlayer) {
      player = dbPlayer;
    }
  } catch {
    // fallback
  }

  if (!player) {
    player = SAMPLE_PLAYERS.find((p) => p.id === params.id) || null;
  }

  if (!player) {
    notFound();
  }

  // 2. Fetch roster ownership
  const rosterItems = await getClubRoster(club.id);
  const isOwned = rosterItems.some((r) => r.player_id === player?.id);

  // 3. Fetch 7-day initial price history from API
  const historyRes = await fetchPriceHistoryAction(player.id, '7d');
  const priceHistory = historyRes.success && historyRes.data ? historyRes.data : [];

  // 4. Fetch any active rumors involving this player
  let activeRumors: any[] = [];
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/rumors?player_id=${player.id}&scouting_level=${club.scouting_level || 1}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      activeRumors = await res.json();
    }
  } catch {
    // ignore
  }

  const purseBalance = Number(club.virtual_purse_balance) || 100000000;
  const injury = INJURY_CONFIG[player.injury_status] || INJURY_CONFIG.fit;
  const premiumPct = ((player.current_market_value - player.base_value) / player.base_value) * 100;
  const isPremiumPositive = premiumPct >= 0;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 pb-16">
      {/* Top Header */}
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/rumors"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all shadow-sm"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Rumor Radar</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-white transition-colors"
            >
              My Squad
            </Link>

            <div className="flex items-center gap-2 text-xs bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-slate-400">Purse:</span>
              <strong className="text-[#00FF87] font-mono">
                £{purseBalance.toLocaleString('en-GB')}
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Link href="/dashboard" className="hover:text-slate-300">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-400">{player.real_team}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white font-bold">{player.name}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Player Profile Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111827] border border-[#22304A] shadow-2xl relative overflow-hidden">
          {/* Subtle glow in background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF87]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                    POSITION_COLORS[player.position] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {player.position}
                </span>

                <span className="text-xs font-mono font-bold text-slate-300 bg-[#161F30] border border-[#22304A] px-2.5 py-0.5 rounded-md">
                  {player.real_team}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${injury.bg} ${injury.color}`}
                >
                  {injury.label}
                </span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {player.name}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Premier League Asset ID: <span className="text-slate-500">{player.id}</span>
                </p>
              </div>

              {/* Badges Strip */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Form Score:</span>
                  <strong className="text-white">{player.form_score.toFixed(2)}/10</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contract Term:</span>
                  <strong className="text-white">{player.contract_months_remaining} Months</strong>
                </div>
              </div>
            </div>

            {/* Live Pricing KPI Summary */}
            <div className="flex flex-col sm:items-end gap-2 bg-[#161F30]/80 p-5 rounded-2xl border border-[#22304A]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Current Market Valuation
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#00FF87]">
                £{player.current_market_value.toLocaleString('en-GB')}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Base: £{(player.base_value / 1e6).toFixed(1)}M</span>
                <span className="text-slate-600">•</span>
                <span
                  className={`font-bold ${
                    isPremiumPositive ? 'text-[#00FF87]' : 'text-rose-400'
                  }`}
                >
                  {isPremiumPositive ? '+' : ''}
                  {premiumPct.toFixed(1)}% vs Base
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Recharts Graph on Left, Trade Terminal on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            <PlayerPriceChart
              playerId={player.id}
              initialData={priceHistory}
              initialTimeframe="7d"
              baseValue={player.base_value}
            />

            {/* Transfer Rumor Intel Feed for this Player */}
            <div className="bg-[#111827] border border-[#22304A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Associated Transfer Rumors
                  </h3>
                </div>
                <Link
                  href="/rumors"
                  className="text-xs font-mono text-[#00FF87] hover:underline flex items-center gap-1"
                >
                  <span>Open Rumor Terminal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {activeRumors.length > 0 ? (
                <div className="space-y-3">
                  {activeRumors.map((rumor: any) => (
                    <div
                      key={rumor.id}
                      className="p-4 rounded-xl bg-[#161F30] border border-[#22304A] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {rumor.tier_label || `Tier ${rumor.tier_rating}`}
                        </span>
                        <span className="text-[10px] font-mono text-[#00FF87]">
                          {rumor.deal_percentage ? `${rumor.deal_percentage}% Deal` : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">"{rumor.headline}"</p>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                        <span>Source: {rumor.source_name}</span>
                        <span>Interested: {rumor.buying_club}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-mono">
                  No active transfer rumors flagged for {player.name}. Market valuation is driven by match performances and real-world transfer news.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: P2P Transfer Desk */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#22304A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-[#38BDF8]" />
                  <h3 className="text-base font-bold text-white tracking-tight">P2P Transfer Desk</h3>
                </div>
                {isOwned ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    In Squad
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/40">
                    League Asset
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transfers occur exclusively through peer-to-peer negotiations within your League World. You can propose swaps, player-plus-cash, or cash adjustments with rival managers.
              </p>
              <Link
                href="/trades"
                className="w-full py-3 rounded-xl bg-[#00FF87] text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#00e67a] active:scale-95 transition-all shadow-md shadow-[#00FF87]/10"
              >
                <span>Open P2P Trading Desk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
