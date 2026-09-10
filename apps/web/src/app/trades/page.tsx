import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser, getClubRoster } from '@/lib/session';
import TradeInbox from './TradeInbox';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  TrendingUp,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TradesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  const roster = await getClubRoster(club.id);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
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
              <span className="font-bold text-white tracking-tight">P2P Trading Desk</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Direct Club-to-Club Negotiations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border bg-[#111827] border-[#22304A]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>Peer-to-Peer Negotiations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Trade Directly with Other Clubs
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Propose player swaps and cash adjustments to other managers. All trades expire in 24 hours.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs bg-[#161F30] px-4 py-2 rounded-lg border border-[#22304A]">
              <Shield className="w-4 h-4 text-[#00FF87]" />
              <span className="text-slate-300">Anti-collusion protection active</span>
            </div>
          </div>
        </div>

        {/* Trade Inbox */}
        <TradeInbox roster={roster} club={club} />
      </main>
    </div>
  );
}
