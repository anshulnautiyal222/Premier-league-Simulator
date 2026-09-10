'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Radar,
  Landmark,
  ArrowUpCircle,
  Loader2,
  AlertCircle,
  Check,
  Gift,
  Coins,
  Sparkles,
} from 'lucide-react';
import { upgradeFacilityAction, openAcademyPackAction, claimStadiumDividendAction } from './actions';
import type { FacilityKey, RookieRarity } from '@/lib/facilities';
import type { RookiePlayer } from '@/lib/data/rookies';

interface AcademyClientProps {
  purseBalance: number;
  academyLevel: number;
  scoutingLevel: number;
  stadiumLevel: number;
  packPrice: number;
  packListPrice: number;
  odds: Record<RookieRarity, number>;
  academyUpgradeCost: number | null;
  scoutingUpgradeCost: number | null;
  stadiumUpgradeCost: number | null;
  earlyMinutes: number;
  embargoMinutes: number;
  weeklyYield: number;
  top11Appeal: number;
  rosterCount: number;
  dividendDue: boolean;
  nextDividendIso: string;
}

const RARITY_LABEL: Record<RookieRarity, string> = {
  common: 'Squad Prospect',
  rare: 'High-Ceiling Rare',
  wonderkid: 'Wonderkid',
};

export default function AcademyClient(props: AcademyClientProps) {
  const router = useRouter();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [revealed, setRevealed] = useState<{ player: RookiePlayer; rarity: RookieRarity; pack_price: number } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (key: string, fn: () => Promise<{ error?: string; success?: boolean; data?: any }>, onOk?: (data: any) => void) => {
    setNotification(null);
    setPendingKey(key);
    startTransition(async () => {
      const res = await fn();
      setPendingKey(null);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        onOk?.(res.data);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Facility Tree · Tiers 1–5
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Infrastructure Board</h1>
        <p className="text-sm text-slate-400 mt-1">
          Reinvest demo purse into academy packs, scouting early-access, and stadium commercial yield.
        </p>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 font-mono">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FacilityCard
          icon={<GraduationCap className="w-5 h-5 text-[#00FF87]" />}
          title="Youth Academy"
          accent="#00FF87"
          level={props.academyLevel}
          cost={props.academyUpgradeCost}
          purse={props.purseBalance}
          pending={isPending && pendingKey === 'academy'}
          onUpgrade={() =>
            run('academy', () => upgradeFacilityAction('academy' as FacilityKey), (data) =>
              setNotification({
                type: 'success',
                message: `Academy upgraded to Tier ${data.new_level}.`,
              })
            )
          }
          effects={[
            `Rookie pack price £${props.packPrice.toLocaleString('en-GB')} (${Math.round((1 - props.packPrice / props.packListPrice) * 100)}% academy discount)`,
            `Odds · Common ${props.odds.common}% · Rare ${props.odds.rare}% · Wonderkid ${props.odds.wonderkid}%`,
            'Higher tiers tilt the pack toward wonderkids with steeper market trajectories',
          ]}
        >
          <button
            onClick={() =>
              run('pack', () => openAcademyPackAction(), (data) => {
                setRevealed({ player: data.player, rarity: data.rarity, pack_price: data.pack_price });
                setNotification({
                  type: 'success',
                  message: `Promoted ${data.player.name} (${RARITY_LABEL[data.rarity as RookieRarity]}) for £${data.pack_price.toLocaleString('en-GB')}.`,
                });
              })
            }
            disabled={isPending || props.rosterCount >= 25 || props.purseBalance < props.packPrice}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00FF87] text-black font-bold text-xs hover:bg-[#00e67a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pendingKey === 'pack' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
            Open Rookie Pack · £{props.packPrice.toLocaleString('en-GB')}
          </button>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            List price £{props.packListPrice.toLocaleString('en-GB')} · roster {props.rosterCount}/25
          </p>
        </FacilityCard>

        <FacilityCard
          icon={<Radar className="w-5 h-5 text-[#38BDF8]" />}
          title="Scouting Department"
          accent="#38BDF8"
          level={props.scoutingLevel}
          cost={props.scoutingUpgradeCost}
          purse={props.purseBalance}
          pending={isPending && pendingKey === 'scouting'}
          onUpgrade={() =>
            run('scouting', () => upgradeFacilityAction('scouting' as FacilityKey), (data) =>
              setNotification({
                type: 'success',
                message: `Scouting upgraded to Tier ${data.new_level}. Early access +${data.new_level * 3}m.`,
              })
            )
          }
          effects={[
            `${props.earlyMinutes} minutes of early access vs the public rumor embargo (${props.embargoMinutes}m)`,
            'Rumor terminal filters rumor_feed to rows your club can see',
            'Embargoed scoops show an Early Access flag until the public clock hits',
          ]}
        />

        <FacilityCard
          icon={<Landmark className="w-5 h-5 text-[#FFD700]" />}
          title="Commercial Stadium"
          accent="#FFD700"
          level={props.stadiumLevel}
          cost={props.stadiumUpgradeCost}
          purse={props.purseBalance}
          pending={isPending && pendingKey === 'stadium'}
          onUpgrade={() =>
            run('stadium', () => upgradeFacilityAction('stadium' as FacilityKey), (data) =>
              setNotification({
                type: 'success',
                message: `Stadium upgraded to Tier ${data.new_level}.`,
              })
            )
          }
          effects={[
            `Projected weekly yield £${props.weeklyYield.toLocaleString('en-GB')}`,
            `Scaled by top-11 squad appeal (£${props.top11Appeal.toLocaleString('en-GB')}) × stadium tier`,
            props.dividendDue
              ? 'Matchweek commercial rights are ready to collect'
              : `Next payout ${new Date(props.nextDividendIso).toLocaleString('en-GB')}`,
          ]}
        >
          <button
            onClick={() =>
              run('dividend', () => claimStadiumDividendAction(), (data) =>
                setNotification({
                  type: 'success',
                  message: `Collected £${Number(data.payout).toLocaleString('en-GB')} stadium yield.`,
                })
              )
            }
            disabled={isPending || !props.dividendDue}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-xs hover:bg-[#e6c200] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pendingKey === 'dividend' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
            {props.dividendDue ? 'Collect Weekly Yield' : 'Yield on cooldown'}
          </button>
        </FacilityCard>
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-[#111827] border border-[#00FF87]/40 shadow-[0_0_40px_rgba(0,255,135,0.08)]"
        >
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#00FF87] mb-2">
            Academy intake · {RARITY_LABEL[revealed.rarity]}
          </p>
          <h3 className="text-2xl font-black text-white">{revealed.player.name}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {revealed.player.position} · Age {revealed.player.age} · Market value £
            {revealed.player.current_market_value.toLocaleString('en-GB')}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            Signed at academy discount of £{revealed.pack_price.toLocaleString('en-GB')} (list £
            {revealed.player.current_market_value.toLocaleString('en-GB')})
          </p>
        </motion.div>
      )}
    </div>
  );
}

function FacilityCard({
  icon,
  title,
  accent,
  level,
  cost,
  purse,
  pending,
  onUpgrade,
  effects,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  level: number;
  cost: number | null;
  purse: number;
  pending: boolean;
  onUpgrade: () => void;
  effects: string[];
  children?: React.ReactNode;
}) {
  const canAfford = cost != null && purse >= cost;

  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#161F30] border border-[#22304A]">{icon}</div>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#22304A] text-slate-200">
          Tier {level} / 5
        </span>
      </div>

      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((tier) => (
          <div
            key={tier}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: tier <= level ? accent : '#22304A' }}
          />
        ))}
      </div>

      <ul className="space-y-2 text-xs text-slate-400 flex-1">
        {effects.map((effect) => (
          <li key={effect} className="flex gap-2">
            <span style={{ color: accent }}>▸</span>
            <span>{effect}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onUpgrade}
        disabled={pending || cost == null || !canAfford}
        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowUpCircle className="w-3.5 h-3.5" style={{ color: accent }} />
        )}
        {cost == null
          ? 'Max tier reached'
          : canAfford
            ? `Upgrade to Tier ${level + 1} · £${cost.toLocaleString('en-GB')}`
            : `Need £${cost.toLocaleString('en-GB')} to upgrade`}
      </button>
      {children}
    </div>
  );
}
