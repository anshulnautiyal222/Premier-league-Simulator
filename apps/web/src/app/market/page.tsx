import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getClubForUser, getClubRoster } from '@/lib/session';
import { SAMPLE_PLAYERS } from '@/lib/data/players';
import MarketClient from './MarketClient';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    redirect('/found-club');
  }

  // Fetch players from database or fallback to sample catalog
  const supabase = createClient();
  let playersList = SAMPLE_PLAYERS;

  try {
    const { data: dbPlayers, error } = await supabase
      .from('players')
      .select('*')
      .order('current_market_value', { ascending: false });

    if (!error && dbPlayers && dbPlayers.length > 0) {
      playersList = dbPlayers;
    }
  } catch {
    // ignore
  }

  // Fetch owned player IDs
  const rosterItems = await getClubRoster(club.id);
  const ownedPlayerIds = rosterItems.map((r) => r.player_id);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <MarketClient
          players={playersList}
          club={{
            id: club.id,
            club_name: club.club_name,
            virtual_purse_balance: Number(club.virtual_purse_balance),
          }}
          ownedPlayerIds={ownedPlayerIds}
        />
      </div>
    </div>
  );
}
