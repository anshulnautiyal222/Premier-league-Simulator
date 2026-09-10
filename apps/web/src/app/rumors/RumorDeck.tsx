'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Flame, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  PlusCircle, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  X,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import { RumorItem, TIER_CONFIG, JournalistTier } from '@/lib/data/rumors';
import { voteRumorAction, submitRumorAction, VoteResult } from './actions';
import { SAMPLE_PLAYERS } from '@/lib/data/players';

interface RumorDeckProps {
  initialRumors: RumorItem[];
  votedRumorIds: Record<string, 'deal' | 'delusion'>;
  clubPurse: number;
}

export default function RumorDeck({ initialRumors, votedRumorIds, clubPurse }: RumorDeckProps) {
  const [rumors, setRumors] = useState<RumorItem[]>(initialRumors);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userVotes, setUserVotes] = useState<Record<string, 'deal' | 'delusion'>>(votedRumorIds);
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeRumor = rumors[currentIndex];

  const handleVote = (vote: 'deal' | 'delusion') => {
    if (!activeRumor) return;
    const targetRumor = activeRumor;

    // Optimistic UI update
    setUserVotes((prev) => ({ ...prev, [targetRumor.id]: vote }));

    // Advance card
    setCurrentIndex((prev) => prev + 1);

    // Call server action in background
    startTransition(async () => {
      const res = await voteRumorAction(targetRumor.id, vote);
      if (res.success && res.data) {
        setLastVoteResult(res.data);
        // Update rumor in local state with new live metrics
        setRumors((prev) =>
          prev.map((r) => {
            if (r.id === targetRumor.id && res.data) {
              return {
                ...r,
                upvotes: res.data.upvotes,
                downvotes: res.data.downvotes,
                total_votes: res.data.total_votes,
                deal_percentage: res.data.deal_percentage,
                delusion_percentage: res.data.delusion_percentage,
                rumor_multiplier: res.data.rumor_multiplier,
                rumor_multiplier_pct: res.data.rumor_multiplier_pct,
              };
            }
            return r;
          })
        );
      }
    });
  };

  const handleSkip = () => {
    if (currentIndex < rumors.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setLastVoteResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Action Header & Live Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#22304A] p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Deal or Delusion Terminal</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Live Consensus
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Swipe right if you believe the transfer scoop is credible. Swipe left if it’s pure fiction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#00FF87]" />
            <span>Submit Scoop</span>
          </button>

          <Link
            href="/trades"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00FF87] hover:bg-[#00e67a] text-black text-xs font-bold transition-all shadow-sm"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>P2P Trades</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Deck Stage */}
      <div className="relative min-h-[560px] flex flex-col items-center justify-center">
        {activeRumor ? (
          <div className="relative w-full max-w-lg mx-auto h-[500px]">
            {/* Background stacked visual layers */}
            {rumors.slice(currentIndex + 1, currentIndex + 3).map((stackedRumor, idx) => {
              const layerDepth = idx + 1;
              return (
                <div
                  key={stackedRumor.id}
                  className="absolute inset-0 rounded-3xl bg-[#111827] border border-[#22304A]/60 shadow-xl pointer-events-none transition-all duration-300"
                  style={{
                    transform: `translateY(${layerDepth * 12}px) scale(${1 - layerDepth * 0.04})`,
                    zIndex: 10 - layerDepth,
                    opacity: 0.7 - layerDepth * 0.25,
                  }}
                />
              );
            })}

            {/* Top Interactive Card */}
            <SwipeCard
              key={activeRumor.id}
              rumor={activeRumor}
              onVote={handleVote}
              hasVoted={Boolean(userVotes[activeRumor.id])}
              votedChoice={userVotes[activeRumor.id]}
            />
          </div>
        ) : (
          /* Empty Deck State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#111827] border border-[#22304A] rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#00FF87]/10 border border-[#00FF87]/30 flex items-center justify-center text-[#00FF87] mx-auto shadow-[0_0_25px_rgba(0,255,135,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Transfer Radar Clear!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have reviewed all {rumors.length} active Premier League transfer scoops.
                Your consensus votes have been weighted into the AMM valuation engine.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161F30] border border-[#22304A] text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Scoops Evaluated:</span>
                <strong className="text-white font-mono">{rumors.length}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Your Community Deals:</span>
                <strong className="text-[#00FF87] font-mono">
                  {Object.values(userVotes).filter((v) => v === 'deal').length}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Your Called Delusions:</span>
                <strong className="text-rose-400 font-mono">
                  {Object.values(userVotes).filter((v) => v === 'delusion').length}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Deck</span>
              </button>
              <Link
                href="/trades"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e67a] text-black text-xs font-bold transition-all shadow-md"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Open P2P Trades</span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Action Buttons Below Card */}
        {activeRumor && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 z-20">
            <button
              onClick={() => handleVote('delusion')}
              disabled={isPending}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
              title="Swipe Left: Call Delusion"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#161F30] border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] group-active:scale-95">
                <ThumbsDown className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 group-hover:text-rose-300 font-mono">
                Delusion (←)
              </span>
            </button>

            <button
              onClick={handleSkip}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 focus:outline-none opacity-60 hover:opacity-100 transition-opacity"
              title="Skip this rumor"
            >
              <div className="w-11 h-11 rounded-xl bg-[#161F30] border border-[#22304A] text-slate-400 flex items-center justify-center hover:text-white transition-all">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Skip
              </span>
            </button>

            <button
              onClick={() => handleVote('deal')}
              disabled={isPending}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
              title="Swipe Right: Confirm Deal"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#161F30] border border-[#00FF87]/30 text-[#00FF87] flex items-center justify-center group-hover:bg-[#00FF87] group-hover:text-black transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] group-active:scale-95">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00FF87] group-hover:text-[#00FF87] font-mono">
                Deal (→)
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Recent Feedback Toast */}
      {lastVoteResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto p-4 rounded-xl bg-[#161F30] border border-[#22304A] flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-[#00FF87]" />
            <span>{lastVoteResult.impact_summary}</span>
          </div>
          <button
            onClick={() => setLastVoteResult(null)}
            className="text-slate-400 hover:text-white text-xs font-mono ml-2"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Submit Rumor Scoop Modal */}
      {isModalOpen && (
        <SubmitRumorModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newRumor) => {
            setRumors((prev) => [newRumor, ...prev]);
            setCurrentIndex(0);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ==============================================================================
// SwipeCard Subcomponent (Framer Motion drag gestures)
// ==============================================================================

interface SwipeCardProps {
  rumor: RumorItem;
  onVote: (vote: 'deal' | 'delusion') => void;
  hasVoted: boolean;
  votedChoice?: 'deal' | 'delusion';
}

function SwipeCard({ rumor, onVote, hasVoted, votedChoice }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.6, 1, 1, 1, 0.6]);

  // Stamp opacities
  const dealStampOpacity = useTransform(x, [40, 120], [0, 1]);
  const delusionStampOpacity = useTransform(x, [-40, -120], [0, 1]);

  const tier = (rumor.tier_rating in TIER_CONFIG ? rumor.tier_rating : 3) as JournalistTier;
  const tierConfig = TIER_CONFIG[tier];

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onVote('deal');
    } else if (info.offset.x < -threshold) {
      onVote('delusion');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 bg-[#111827] border border-[#22304A] rounded-3xl p-6 flex flex-col justify-between shadow-2xl select-none cursor-grab touch-none overflow-hidden z-20 hover:border-[#374967] transition-colors"
    >
      {/* Background radial tint based on tier */}
      <div 
        className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{
          backgroundColor: tier === 1 ? '#00FF87' : tier === 2 ? '#38BDF8' : tier === 3 ? '#F59E0B' : tier === 4 ? '#FB923C' : '#F43F5E'
        }}
      />

      {/* DEAL STAMP OVERLAY */}
      <motion.div
        style={{ opacity: dealStampOpacity }}
        className="absolute top-8 left-8 border-4 border-[#00FF87] text-[#00FF87] font-black text-2xl px-4 py-1.5 rounded-xl rotate-[-12deg] tracking-widest pointer-events-none z-30 uppercase shadow-[0_0_20px_rgba(0,255,135,0.4)]"
      >
        DEAL ✓
      </motion.div>

      {/* DELUSION STAMP OVERLAY */}
      <motion.div
        style={{ opacity: delusionStampOpacity }}
        className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-black text-2xl px-4 py-1.5 rounded-xl rotate-[12deg] tracking-widest pointer-events-none z-30 uppercase shadow-[0_0_20px_rgba(244,63,94,0.4)]"
      >
        DELUSION ✕
      </motion.div>

      {/* Top Bar: Credibility Tier Badge & Time */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold font-mono tracking-wide ${tierConfig.bg} ${tierConfig.border} ${tierConfig.text} ${tierConfig.badgeGlow}`}>
            <Shield className="w-3.5 h-3.5" />
            <span>{tierConfig.tag}</span>
          </div>
          {rumor.early_access && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8] text-[10px] font-mono font-bold uppercase">
              Early Access
            </span>
          )}
        </div>

        <span className="text-[10px] font-mono text-slate-400">
          {new Date(rumor.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Middle Section: Player Scoop Details */}
      <div className="space-y-4 my-auto z-10">
        {/* Source citation */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Reported by:</span>
          <strong className="text-white">{rumor.source_name}</strong>
        </div>

        {/* Transfer Pathway Banner */}
        <div className="bg-[#161F30]/80 rounded-2xl p-4 border border-[#22304A] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Selling Club
            </span>
            <span className="text-sm font-bold text-white">{rumor.real_team}</span>
          </div>

          <div className="flex flex-col items-center px-3">
            <ArrowRight className="w-5 h-5 text-[#00FF87]" />
            {rumor.fee_estimate && (
              <span className="text-[10px] font-mono font-bold text-[#FFD700] mt-0.5">
                £{(rumor.fee_estimate / 1000000).toFixed(0)}M
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Buying Club
            </span>
            <span className="text-sm font-bold text-[#00FF87]">{rumor.buying_club}</span>
          </div>
        </div>

        {/* Player Name & Headline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {rumor.player_name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#22304A] text-slate-300">
              {rumor.position}
            </span>
          </div>

          <p className="text-sm text-slate-300 font-medium leading-snug">
            "{rumor.headline}"
          </p>
        </div>
      </div>

      {/* Bottom Section: Live Consensus Sentiment & Multiplier Impact */}
      <div className="space-y-3 pt-3 border-t border-[#22304A] z-10">
        {/* Consensus Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#00FF87] font-bold flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {rumor.deal_percentage.toFixed(0)}% DEAL
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              {rumor.delusion_percentage.toFixed(0)}% DELUSION
              <ThumbsDown className="w-3 h-3" />
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#0A0E17] rounded-full overflow-hidden flex border border-[#22304A]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rumor.deal_percentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-[#00FF87] h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rumor.delusion_percentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-rose-500 h-full"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>{rumor.upvotes.toLocaleString()} votes</span>
            <span>{rumor.downvotes.toLocaleString()} votes</span>
          </div>
        </div>

        {/* Dynamic Multiplier Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#161F30] border border-[#22304A]">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-[#00FF87]" />
            <span className="text-[11px]">Pricing Engine Multiplier:</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#00FF87] bg-[#00FF87]/10 border border-[#00FF87]/30 px-2 py-0.5 rounded">
            {rumor.rumor_multiplier_pct}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ==============================================================================
// Submit Rumor Modal
// ==============================================================================

interface SubmitModalProps {
  onClose: () => void;
  onSuccess: (newRumor: RumorItem) => void;
}

function SubmitRumorModal({ onClose, onSuccess }: SubmitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('tier_rating', selectedTier.toString());

    const res = await submitRumorAction(formData);
    setIsSubmitting(false);

    if (res.success && res.data) {
      onSuccess(res.data);
    } else {
      setError(res.error || 'Failed to submit rumor scoop.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#111827] border border-[#22304A] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between border-b border-[#22304A] pb-4">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-[#00FF87]" />
            <h3 className="text-lg font-bold text-white">Ingest Transfer Scoop</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#161F30]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Targeted Player */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Target Player</label>
            <select
              name="player_id"
              required
              className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#00FF87]"
            >
              {SAMPLE_PLAYERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.real_team} • {p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Source Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Journalist / Source Name</label>
            <input
              type="text"
              name="source_name"
              placeholder="e.g. David Ornstein, Fabrizio Romano, The Times"
              required
              className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#00FF87]"
            />
          </div>

          {/* Credibility Tier Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Source Credibility Tier</label>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as JournalistTier[]).map((t) => {
                const conf = TIER_CONFIG[t];
                const isSelected = selectedTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={`py-2 px-1 rounded-xl text-center border font-mono font-bold text-[11px] transition-all ${
                      isSelected
                        ? `${conf.bg} ${conf.border} ${conf.text} ring-2 ring-[#00FF87]/50`
                        : 'bg-[#161F30] border-[#22304A] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    T{t}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {TIER_CONFIG[selectedTier as JournalistTier].label}
            </p>
          </div>

          {/* Buying Club & Fee Estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Buying Club</label>
              <input
                type="text"
                name="buying_club"
                placeholder="e.g. Real Madrid, PSG"
                required
                className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#00FF87]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Estimated Fee (£ GBP)</label>
              <input
                type="number"
                name="fee_estimate"
                placeholder="e.g. 85000000"
                className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#00FF87]"
              />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Headline / Details (Optional)</label>
            <textarea
              name="headline"
              rows={2}
              placeholder="e.g. Initial contacts initiated between directors..."
              className="w-full bg-[#161F30] border border-[#22304A] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#00FF87]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#22304A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161F30] hover:bg-[#22304A] text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#00FF87] hover:bg-[#00e67a] text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Ingesting...' : 'Publish Scoop'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
