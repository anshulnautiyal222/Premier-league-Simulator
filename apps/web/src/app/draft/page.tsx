import { redirect } from 'next/navigation';
import { getLeagueDraftInfo } from './actions';
import DraftRoomClient from './DraftRoomClient';

export const dynamic = 'force-dynamic';

export default async function DraftPage() {
  const info = await getLeagueDraftInfo();
  if ('error' in info) {
    if (info.error === 'Not authenticated') {
      redirect('/auth/login');
    }
    if (info.error === 'No club found') {
      redirect('/found-club');
    }
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100">
      <DraftRoomClient
        league={info.league}
        club={info.club}
        bids={info.bids}
        roster={info.roster}
        availablePlayers={info.availablePlayers}
      />
    </div>
  );
}
