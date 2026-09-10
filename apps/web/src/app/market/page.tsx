import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MarketClient from './MarketClient';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const supabase = createClient();

  // Retrieve user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Retrieve club
  const { data: club } = await supabase
    .from('clubs')
    .select('id, club_name, virtual_purse_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!club) {
    redirect('/found-club');
  }

  // Fetch all players from catalog
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .order('current_market_value', { ascending: false });

  // Fetch owned player IDs for this club
  const { data: rosterEntries } = await supabase
    .from('club_roster')
    .select('player_id')
    .eq('club_id', club.id);

  const ownedPlayerIds = (rosterEntries || []).map((r: { player_id: string }) => r.player_id);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <MarketClient
          players={players || []}
          club={club}
          ownedPlayerIds={ownedPlayerIds}
        />
      </div>
    </div>
  );
}
