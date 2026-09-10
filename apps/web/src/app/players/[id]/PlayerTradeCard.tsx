'use client';

import { useState, useTransition } from 'react';
import { buyPlayerAction, sellPlayerAction } from '@/app/market/actions';
import { 
  Coins, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayerTradeCardProps {
  player: {
    id: string;
    name: string;
    current_market_value: number;
    base_value: number;
  };
  isOwned: boolean;
  purseBalance: number;
  clubId: string;
}

export default function PlayerTradeCard({
  player,
  isOwned,
  purseBalance,
  clubId,
}: PlayerTradeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const price = player.current_market_value;
  const brokerFee = Math.round(price * 0.03);
  const netProceeds = price - brokerFee;
  const canAfford = purseBalance >= price;

  const handleBuy = () => {
    if (!canAfford) {
      setNotification({
        type: 'error',
        message: `Insufficient virtual funds (£${(purseBalance / 1e6).toFixed(1)}M) to meet asking price (£${(price / 1e6).toFixed(1)}M).`,
      });
      return;
    }

    setNotification(null);
    startTransition(async () => {
      const res = await buyPlayerAction(player.id);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({
          type: 'success',
          message: `Successfully acquired ${player.name} for £${price.toLocaleString('en-GB')}!`,
        });
        router.refresh();
      }
    });
  };

  const handleSell = () => {
    const confirmSell = window.confirm(
      `Confirm Transfer List Liquidation:\n\nPlayer: ${player.name}\nGross Market Value: £${price.toLocaleString()}\nAMM Broker Fee (3%): -£${brokerFee.toLocaleString()}\nNet Virtual Cash Inflow: £${netProceeds.toLocaleString()}`
    );
    if (!confirmSell) return;

    setNotification(null);
    startTransition(async () => {
      const res = await sellPlayerAction(player.id);
      if (res.error) {
        setNotification({ type: 'error', message: res.error });
      } else {
        setNotification({
          type: 'success',
          message: `Successfully liquidated ${player.name}. Added £${netProceeds.toLocaleString('en-GB')} to virtual purse.`,
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-[#111827] border border-[#22304A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#22304A] pb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#00FF87]" />
          <h3 className="text-base font-bold text-white tracking-tight">Direct Trading Terminal</h3>
        </div>
        {isOwned ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/40 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Squad Member
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/40">
            Open Market Asset
          </span>
        )}
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white font-mono text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Transaction Details */}
      <div className="bg-[#161F30] rounded-xl p-4 border border-[#22304A] space-y-2.5 text-xs font-mono">
        <div className="flex justify-between items-center text-slate-400">
          <span>Asking Fee / Market Value:</span>
          <strong className="text-white">£{price.toLocaleString('en-GB')}</strong>
        </div>

        {isOwned ? (
          <>
            <div className="flex justify-between items-center text-rose-400">
              <span>AMM Broker Fee (3%):</span>
              <strong>-£{brokerFee.toLocaleString('en-GB')}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-[#22304A]">
              <span>Net Inflow to Purse:</span>
              <strong className="text-[#00FF87] text-sm font-bold">
                +£{netProceeds.toLocaleString('en-GB')}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center text-slate-400">
              <span>Your Available Purse:</span>
              <span className={canAfford ? 'text-[#00FF87]' : 'text-rose-400'}>
                £{purseBalance.toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-[#22304A]">
              <span>Remaining Purse After Signing:</span>
              <strong className={canAfford ? 'text-white' : 'text-rose-400'}>
                {canAfford
                  ? `£${(purseBalance - price).toLocaleString('en-GB')}`
                  : 'Insufficient Funds'}
              </strong>
            </div>
          </>
        )}
      </div>

      {/* Execution Buttons */}
      {isOwned ? (
        <button
          onClick={handleSell}
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500 border border-rose-500/40 hover:border-rose-500 text-rose-400 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Liquidation...</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4" />
              <span>Liquidate Contract (Net £{(netProceeds / 1e6).toFixed(1)}M)</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleBuy}
          disabled={isPending || !canAfford}
          className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            canAfford
              ? 'bg-[#00FF87] hover:bg-[#00e67a] text-black shadow-lg shadow-[#00FF87]/20 active:scale-[0.99]'
              : 'bg-[#161F30] border border-[#22304A] text-slate-500 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing Player...</span>
            </>
          ) : canAfford ? (
            <>
              <Coins className="w-4 h-4" />
              <span>Execute Transfer (£{(price / 1e6).toFixed(1)}M)</span>
            </>
          ) : (
            <span>Insufficient Purse Funds</span>
          )}
        </button>
      )}
    </div>
  );
}
