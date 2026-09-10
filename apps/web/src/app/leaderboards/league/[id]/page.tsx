import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LeagueLeaderboardPage() {
  // In SPEC v2 (League Worlds), standings are centrally scoped to the user's active League World
  redirect('/leaderboards');
}

