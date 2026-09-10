'use client';

import { useState, useTransition } from 'react';
import { sellPlayerAction } from '@/app/market/actions';
import { 
  Users, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

interface RosterPlayer {
  id: string; // roster row id
  playerId: string;
  name: string;
  realTeam: string;
  position: string;
  acquisitionPrice: number;
  currentMarketValue: number;
  formScore: number;
  injuryStatus: string;
  inStartingXi: boolean;
}

interface RosterTableProps {
  roster: RosterPlayer[];
  purseBalance: number;
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FWD: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function RosterTable({ roster, purseBalance }: RosterTableProps) {
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSell = (player: RosterPlayer) => {
    const brokerFee = Math.round(player.currentMarketValue * 0.03);
    const netProceeds = player.currentMarketValue - brokerFee;
    const confirmSell = window.confirm(
      `Liquidate ${player.name}?\n\nGross Value: £${player.currentMarketValue.toLocaleString()}\nBroker Fee (3%): -£${brokerFee.toLocaleString()}\nNet Proceeds: £${netProceeds.toLocaleString()}\n\nProceed?`
    );

    if (!confirmSell) return;

    setNotification(null);
    setSellingId(player.playerId);

    startTransition(async () => {
      const res = await sellPlayerAction(player.playerId);
      setSellingId(null);

      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({
          type: 'success',
          message: `Liquidated ${player.name} for £${netProceeds.toLocaleString('en-GB')} net (3% fee applied).`,
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00FF87]" />
            Active Club Roster ({roster.length} / 25 Players)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hold player cards for capital appreciation or liquidate back to the market pool.
          </p>
        </div>

        <Link
          href="/market"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00FF87] text-black font-bold text-xs hover:bg-[#00e67a] active:scale-95 transition-all shadow-sm"
        >
          <span>Open Transfer Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {roster.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#111827] border border-[#22304A] text-center">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Players Signed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Your £{purseBalance.toLocaleString('en-GB')} purse is waiting. Head to the transfer market to sign your first Premier League stars and wonderkids.
          </p>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00FF87] text-black font-extrabold text-xs hover:bg-[#00e67a] transition-all"
          >
            <span>Browse Transfer Market</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[#22304A] bg-[#111827] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161F30] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#22304A]">
                <tr>
                  <th className="px-4 py-3.5">Player</th>
                  <th className="px-4 py-3.5">Pos</th>
                  <th className="px-4 py-3.5">Real Club</th>
                  <th className="px-4 py-3.5 text-right">Bought For</th>
                  <th className="px-4 py-3.5 text-right">Current Value</th>
                  <th className="px-4 py-3.5 text-right">PnL (Return)</th>
                  <th className="px-4 py-3.5 text-center">Liquidate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22304A]/60">
                {roster.map((player) => {
                  const pnl = player.currentMarketValue - player.acquisitionPrice;
                  const pnlPercent = player.acquisitionPrice > 0 
                    ? ((pnl / player.acquisitionPrice) * 100).toFixed(1) 
                    : '0.0';
                  const isSelling = sellingId === player.playerId;

                  return (
                    <tr key={player.id} className="hover:bg-[#161F30]/60 transition-colors">
                      {/* Player Name */}
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#161F30] border border-[#22304A] flex items-center justify-center text-[10px] text-slate-300 font-mono">
                            {player.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{player.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Form: {player.formScore.toFixed(1)}/10
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${POSITION_COLORS[player.position] || 'bg-slate-800 text-slate-300'}`}>
                          {player.position}
                        </span>
                      </td>

                      {/* Real Club */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {player.realTeam}
                      </td>

                      {/* Acquisition Price */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                        £{player.acquisitionPrice.toLocaleString('en-GB')}
                      </td>

                      {/* Current Value */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                        £{player.currentMarketValue.toLocaleString('en-GB')}
                      </td>

                      {/* PnL */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold">
                        <div className={`flex items-center justify-end gap-1 ${pnl >= 0 ? 'text-[#00FF87]' : 'text-rose-400'}`}>
                          {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{pnl >= 0 ? '+' : ''}£{pnl.toLocaleString('en-GB')}</span>
                          <span className="text-[10px] text-slate-400">({pnlPercent}%)</span>
                        </div>
                      </td>

                      {/* Sell Action */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleSell(player)}
                          disabled={isPending || isSelling}
                          title="Liquidate player (-3% broker fee)"
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors disabled:opacity-40"
                        >
                          {isSelling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              <span>Sell</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-[#161F30] border-t border-[#22304A] flex items-center justify-between text-[11px] text-slate-400">
            <span>Platform Broker Fee: <strong>3% deducted upon liquidation</strong></span>
            <span>Roster capacity: <strong>{roster.length} / 25</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
