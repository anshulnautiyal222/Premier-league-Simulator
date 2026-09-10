'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getClubForUser } from '@/lib/session';

export interface LeaderboardEntry {
  rank: number;
  club_id: string;
  club_name: string;
  badge_url: string;
  colors: { primary: string; secondary: string };
  net_worth: number;
  trading_roi: number;
  squad_battle_value: number;
  is_current_user: boolean;
}

export async function getGlobalLeaderboards(limit: number = 100) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const userClub = user ? await getClubForUser(user.id) : null;

  try {
    // Fetch all clubs with their squad values
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, club_name, badge_url, colors, virtual_purse_balance, total_squad_value, user_id')
      .order('virtual_purse_balance + total_squad_value', { ascending: false })
      .limit(limit);

    if (error) {
      return { netWorth: [], tradingRoi: [], squadBattles: [], currentRank: null };
    }

    // Calculate net worth for each club
    const entries: LeaderboardEntry[] = clubs.map((club: any, index) => {
      const netWorth = Number(club.virtual_purse_balance) + Number(club.total_squad_value);
      
      // Calculate trading ROI (simplified: squad value / initial £150M)
      const tradingRoi = netWorth > 0 ? ((netWorth - 150000000) / 150000000) * 100 : 0;
      
      // Squad battle value (squad value only)
      const squadBattleValue = Number(club.total_squad_value);

      return {
        rank: index + 1,
        club_id: club.id,
        club_name: club.club_name,
        badge_url: club.badge_url,
        colors: club.colors,
        net_worth: netWorth,
        trading_roi: tradingRoi,
        squad_battle_value: squadBattleValue,
        is_current_user: userClub?.id === club.id,
      };
    });

    // Sort by different metrics for each leaderboard
    const netWorthSorted = [...entries].sort((a, b) => b.net_worth - a.net_worth);
    const tradingRoiSorted = [...entries].sort((a, b) => b.trading_roi - a.trading_roi);
    const squadBattlesSorted = [...entries].sort((a, b) => b.squad_battle_value - a.squad_battle_value);

    // Re-rank after sorting
    netWorthSorted.forEach((e, i) => e.rank = i + 1);
    tradingRoiSorted.forEach((e, i) => e.rank = i + 1);
    squadBattlesSorted.forEach((e, i) => e.rank = i + 1);

    // Find current user's rank in net worth leaderboard
    const currentRank = userClub 
      ? netWorthSorted.find(e => e.is_current_user)?.rank || null 
      : null;

    return {
      netWorth: netWorthSorted,
      tradingRoi: tradingRoiSorted,
      squadBattles: squadBattlesSorted,
      currentRank,
    };
  } catch {
    return { netWorth: [], tradingRoi: [], squadBattles: [], currentRank: null };
  }
}

export async function getLeagueLeaderboard(leagueId: string) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const userClub = user ? await getClubForUser(user.id) : null;

  try {
    // Fetch league and member clubs
    const { data: league, error: leagueError } = await supabase
      .from('private_leagues')
      .select('id, name, member_club_ids')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      return { error: 'League not found' };
    }

    // Fetch all member clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, club_name, badge_url, colors, virtual_purse_balance, total_squad_value')
      .in('id', league.member_club_ids || []);

    if (clubsError || !clubs) {
      return { league, entries: [], currentRank: null };
    }

    // Calculate leaderboard entries
    const entries: LeaderboardEntry[] = clubs.map((club: any, index) => {
      const netWorth = Number(club.virtual_purse_balance) + Number(club.total_squad_value);
      const tradingRoi = netWorth > 0 ? ((netWorth - 150000000) / 150000000) * 100 : 0;
      const squadBattleValue = Number(club.total_squad_value);

      return {
        rank: index + 1,
        club_id: club.id,
        club_name: club.club_name,
        badge_url: club.badge_url,
        colors: club.colors,
        net_worth: netWorth,
        trading_roi: tradingRoi,
        squad_battle_value: squadBattleValue,
        is_current_user: userClub?.id === club.id,
      };
    });

    // Sort by net worth
    entries.sort((a, b) => b.net_worth - a.net_worth);
    entries.forEach((e, i) => e.rank = i + 1);

    const currentRank = userClub 
      ? entries.find(e => e.is_current_user)?.rank || null 
      : null;

    return { league, entries, currentRank };
  } catch {
    return { error: 'Failed to fetch league leaderboard' };
  }
}

export async function getUserLeagues() {
  const user = await getCurrentUser();
  if (!user) {
    return { owned: [], member: [] };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { owned: [], member: [] };
  }

  const supabase = createClient();

  try {
    // Fetch leagues where user is owner
    const { data: owned } = await supabase
      .from('private_leagues')
      .select('*')
      .eq('owner_club_id', club.id);

    // Fetch leagues where user is a member
    const { data: memberships } = await supabase
      .from('league_membership')
      .select('league_id')
      .eq('club_id', club.id);

    const memberIds = memberships?.map(m => m.league_id) || [];
    
    let memberLeagues = [];
    if (memberIds.length > 0) {
      const { data: member } = await supabase
        .from('private_leagues')
        .select('*')
        .in('id', memberIds);
      memberLeagues = member || [];
    }

    return {
      owned: owned || [],
      member: memberLeagues,
    };
  } catch {
    return { owned: [], member: [] };
  }
}
