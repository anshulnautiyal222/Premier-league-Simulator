import { redirect } from 'next/navigation';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import CreateLeagueForm from './CreateLeagueForm';
import { ArrowLeft, Users, Trophy } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CreateLeaguePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
      {/* Header */}
      <header className="border-b border-[#22304A] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/leaderboards"
              className="p-2 rounded-lg bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-bold text-white tracking-tight">Create Private League</span>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-slate-400">
                Custom Competition Setup
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border bg-[#111827] border-[#22304A] mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30">
              <Users className="w-6 h-6 text-[#38BDF8]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Start Your Own League
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Create a private league to compete with friends using custom rules
              </p>
            </div>
          </div>
        </div>

        {/* Create Form */}
        <CreateLeagueForm club={club} />
      </main>
    </div>
  );
}
