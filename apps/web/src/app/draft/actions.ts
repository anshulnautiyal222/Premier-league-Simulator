'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getClubForUser, getClubRoster, addPlayerToRoster } from '@/lib/session';
import { SAMPLE_PLAYERS, SeedPlayer } from '@/lib/data/players';
import type { LeagueWorld, DraftBid } from '@gafferdex/shared-types';

const DEMO_BIDS_COOKIE = 'gafferdex_demo_draft_bids';
const DEMO_LEAGUE_COOKIE = 'gafferdex_demo_league';

const DEFAULT_DEMO_LEAGUE: LeagueWorld = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Premier League Alpha World',
  inviteCode: 'ALPHA16',
  status: 'DRAFT_ACTIVE',
  maxClubs: 16,
  currentGameweek: 1,
  draftCreditBudget: 500,
  draftDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getLeagueDraftInfo() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'No club found' };
  }

  const cookieStore = cookies();
  const supabase = createClient();
  const leagueId = club.league_id || DEFAULT_DEMO_LEAGUE.id;

  let league: LeagueWorld = DEFAULT_DEMO_LEAGUE;
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .maybeSingle();

    if (!error && data) {
      league = {
        id: data.id,
        name: data.name,
        inviteCode: data.invite_code,
        status: data.status,
        maxClubs: data.max_clubs,
        currentGameweek: data.current_gameweek,
        draftCreditBudget: data.draft_credit_budget,
        draftDeadline: data.draft_deadline,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch {
    const stored = cookieStore.get(DEMO_LEAGUE_COOKIE)?.value;
    if (stored) {
      try {
        league = JSON.parse(stored);
      } catch {}
    }
  }

  // Get current roster
  const roster = await getClubRoster(club.id);
  const ownedPlayerIds = new Set(roster.map((r) => r.player_id));

  // Get active bids
  let bids: DraftBid[] = [];
  try {
    const { data, error } = await supabase
      .from('league_draft_bids')
      .select('*')
      .eq('club_id', club.id)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      bids = data.map((b) => ({
        id: b.id,
        leagueId: b.league_id,
        clubId: b.club_id,
        playerId: b.player_id,
        bidAmount: b.bid_amount,
        round: b.round,
        status: b.status,
        createdAt: b.created_at,
      }));
    }
  } catch {
    const storedBids = cookieStore.get(DEMO_BIDS_COOKIE)?.value;
    if (storedBids) {
      try {
        bids = JSON.parse(storedBids);
      } catch {}
    }
  }

  const pendingBids = bids.filter((b) => b.status === 'PENDING');
  const committedCredits = pendingBids.reduce((sum, b) => sum + b.bidAmount, 0);
  const totalBudget = club.draft_credits ?? 500;
  const remainingBudget = Math.max(0, totalBudget - committedCredits);

  // Available unowned players
  const availablePlayers = SAMPLE_PLAYERS.filter(
    (p) => !ownedPlayerIds.has(p.id)
  );

  return {
    league,
    club: {
      id: club.id,
      name: club.club_name,
      draftCredits: totalBudget,
      remainingCredits: remainingBudget,
      committedCredits,
    },
    bids,
    roster,
    availablePlayers,
  };
}

export async function submitDraftBidAction(playerId: string, bidAmount: number) {
  if (!playerId || bidAmount <= 0) {
    return { error: 'Invalid bid parameters.' };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated.' };

  const club = await getClubForUser(user.id);
  if (!club) return { error: 'Club not found.' };

  const info = await getLeagueDraftInfo();
  if ('error' in info || !info.club) {
    return { error: 'Failed to retrieve draft info.' };
  }

  if (info.league.status !== 'DRAFT_ACTIVE') {
    return { error: 'Draft window is closed for this League World.' };
  }

  const existingBid = info.bids.find(
    (b) => b.playerId === playerId && b.status === 'PENDING'
  );
  const existingAmount = existingBid ? existingBid.bidAmount : 0;
  const netAdditional = bidAmount - existingAmount;

  if (netAdditional > info.club.remainingCredits) {
    return {
      error: `Insufficient draft credits. You have ${info.club.remainingCredits} available (trying to bid ${bidAmount}).`,
    };
  }

  const cookieStore = cookies();
  const supabase = createClient();
  const leagueId = club.league_id || DEFAULT_DEMO_LEAGUE.id;

  try {
    if (existingBid) {
      await supabase
        .from('league_draft_bids')
        .update({ bid_amount: bidAmount, updated_at: new Date().toISOString() })
        .eq('id', existingBid.id);
    } else {
      await supabase.from('league_draft_bids').insert({
        league_id: leagueId,
        club_id: club.id,
        player_id: playerId,
        bid_amount: bidAmount,
        status: 'PENDING',
      });
    }
  } catch {
    let currentList: DraftBid[] = [];
    const stored = cookieStore.get(DEMO_BIDS_COOKIE)?.value;
    if (stored) {
      try {
        currentList = JSON.parse(stored);
      } catch {}
    }

    if (existingBid) {
      currentList = currentList.map((b) =>
        b.id === existingBid.id ? { ...b, bidAmount } : b
      );
    } else {
      const newBid: DraftBid = {
        id: `bid_${Date.now()}`,
        leagueId,
        clubId: club.id,
        playerId,
        bidAmount,
        round: 1,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      currentList.unshift(newBid);
    }

    cookieStore.set(DEMO_BIDS_COOKIE, JSON.stringify(currentList), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/draft');
  return { success: true, message: `Sealed bid of ${bidAmount} draft credits submitted!` };
}

export async function cancelDraftBidAction(bidId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated.' };

  const club = await getClubForUser(user.id);
  if (!club) return { error: 'Club not found.' };

  const cookieStore = cookies();
  const supabase = createClient();

  try {
    await supabase
      .from('league_draft_bids')
      .update({ status: 'CANCELLED' })
      .eq('id', bidId)
      .eq('club_id', club.id);
  } catch {
    let currentList: DraftBid[] = [];
    const stored = cookieStore.get(DEMO_BIDS_COOKIE)?.value;
    if (stored) {
      try {
        currentList = JSON.parse(stored);
      } catch {}
    }
    currentList = currentList.map((b) =>
      b.id === bidId ? { ...b, status: 'CANCELLED' as const } : b
    );
    cookieStore.set(DEMO_BIDS_COOKIE, JSON.stringify(currentList), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/draft');
  return { success: true, message: 'Draft bid cancelled. Credits refunded.' };
}

export async function resolveDraftAction(leagueId: string) {
  const supabase = createClient();
  const cookieStore = cookies();

  try {
    const { data: resData, error: resError } = await supabase.rpc(
      'resolve_draft_window',
      { p_league_id: leagueId }
    );
    if (resError) throw resError;

    const { data: fillData, error: fillError } = await supabase.rpc(
      'autofill_league_rosters',
      { p_league_id: leagueId }
    );
    if (fillError) throw fillError;

    revalidatePath('/draft');
    revalidatePath('/dashboard');
    revalidatePath('/leaderboards');
    return { success: true, result: { resData, fillData } };
  } catch {
    const user = await getCurrentUser();
    const club = user ? await getClubForUser(user.id) : null;
    if (!club) return { error: 'Club not found.' };

    let currentList: DraftBid[] = [];
    const stored = cookieStore.get(DEMO_BIDS_COOKIE)?.value;
    if (stored) {
      try {
        currentList = JSON.parse(stored);
      } catch {}
    }

    const pending = currentList.filter((b) => b.status === 'PENDING');
    let awarded = 0;
    for (const bid of pending) {
      const player = SAMPLE_PLAYERS.find((p) => p.id === bid.playerId);
      if (player) {
        await addPlayerToRoster(club.id, player, leagueId);
        bid.status = 'WON';
        awarded++;
      }
    }

    const currentRoster = await getClubRoster(club.id);
    const ownedIds = new Set(currentRoster.map((r) => r.player_id));
    const needed = Math.max(0, 11 - currentRoster.length);
    const unowned = SAMPLE_PLAYERS.filter((p) => !ownedIds.has(p.id))
      .sort((a, b) => a.base_value - b.base_value)
      .slice(0, needed);

    for (const p of unowned) {
      await addPlayerToRoster(club.id, p, leagueId);
    }

    cookieStore.set(DEMO_BIDS_COOKIE, JSON.stringify(currentList), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    const updatedLeague: LeagueWorld = {
      ...DEFAULT_DEMO_LEAGUE,
      id: leagueId,
      status: 'LIVE',
    };
    cookieStore.set(DEMO_LEAGUE_COOKIE, JSON.stringify(updatedLeague), {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/draft');
    revalidatePath('/dashboard');
    revalidatePath('/leaderboards');
    return {
      success: true,
      message: `Draft resolved! Awarded ${awarded} won bids + ${unowned.length} auto-filled players. League World is now LIVE!`,
    };
  }
}
