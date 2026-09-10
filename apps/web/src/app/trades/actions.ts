'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  getCurrentUser, 
  getClubForUser, 
  getClubRoster,
  updateClubPurse,
  addPlayerToRoster,
  removePlayerFromRoster,
  type RosterItem
} from '@/lib/session';
import { SAMPLE_PLAYERS } from '@/lib/data/players';
import { revalidatePath } from 'next/cache';

export async function proposeTradeAction(
  recipientClubId: string,
  offeredPlayerIds: string[],
  requestedPlayerIds: string[],
  cashAdjustment: number
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to propose trades.' };
  }

  const proposerClub = await getClubForUser(user.id);
  if (!proposerClub) {
    return { error: 'Your club not found. Please found a club first.' };
  }

  if (recipientClubId === proposerClub.id) {
    return { error: 'You cannot trade with yourself.' };
  }

  const supabase = createClient();

  // 1. Validate recipient club exists
  let recipientClub: any;
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', recipientClubId)
      .maybeSingle();
    
    if (error || !club) {
      return { error: 'Recipient club not found.' };
    }
    recipientClub = club;
  } catch {
    return { error: 'Failed to validate recipient club.' };
  }

  // 2. Validate offered players belong to proposer
  const proposerRoster = await getClubRoster(proposerClub.id);
  const proposerPlayerIds = new Set(proposerRoster.map(r => r.player_id));
  
  for (const pid of offeredPlayerIds) {
    if (!proposerPlayerIds.has(pid)) {
      return { error: 'You cannot offer players you do not own.' };
    }
  }

  // 3. Validate roster size constraints (11-25) after trade
  const proposerFinalSize = proposerRoster.length - offeredPlayerIds.length + requestedPlayerIds.length;
  if (proposerFinalSize < 11 || proposerFinalSize > 25) {
    return { error: `Trade would result in invalid squad size (${proposerFinalSize}). Must be between 11-25 players.` };
  }

  // 4. Get recipient roster to validate their constraints
  let recipientRoster: RosterItem[] = [];
  try {
    recipientRoster = await getClubRoster(recipientClubId);
  } catch {
    recipientRoster = [];
  }

  // Validate requested players belong to recipient
  const recipientPlayerIds = new Set(recipientRoster.map(r => r.player_id));
  for (const pid of requestedPlayerIds) {
    if (!recipientPlayerIds.has(pid)) {
      return { error: 'You cannot request players the recipient does not own.' };
    }
  }

  const recipientFinalSize = recipientRoster.length - requestedPlayerIds.length + offeredPlayerIds.length;
  if (recipientFinalSize < 11 || recipientFinalSize > 25) {
    return { error: `Trade would result in invalid squad size for recipient (${recipientFinalSize}). Must be between 11-25 players.` };
  }

  // 5. Validate cash balance
  const proposerPurse = Number(proposerClub.virtual_purse_balance);
  const recipientPurse = Number(recipientClub.virtual_purse_balance);

  if (cashAdjustment > 0) {
    // Proposer pays recipient
    if (proposerPurse < cashAdjustment) {
      return { error: `Insufficient purse balance to offer cash adjustment.` };
    }
  } else if (cashAdjustment < 0) {
    // Recipient pays proposer (cashAdjustment is negative)
    if (recipientPurse < Math.abs(cashAdjustment)) {
      return { error: `Recipient has insufficient purse balance for cash adjustment.` };
    }
  }

  // 6. Calculate fair market value for anti-wash-trading check (Section 10)
  const offeredPlayers = offeredPlayerIds.map(pid => 
    SAMPLE_PLAYERS.find(p => p.id === pid) || proposerRoster.find(r => r.player_id === pid)?.player
  ).filter(Boolean);
  
  const requestedPlayers = requestedPlayerIds.map(pid =>
    SAMPLE_PLAYERS.find(p => p.id === pid) || recipientRoster.find(r => r.player_id === pid)?.player
  ).filter(Boolean);

  const offeredValue = offeredPlayers.reduce((sum, p) => sum + (p?.current_market_value || 0), 0);
  const requestedValue = requestedPlayers.reduce((sum, p) => sum + (p?.current_market_value || 0), 0);
  const valueDelta = requestedValue - offeredValue;

  // Anti-wash-trading: cash adjustment must be within 25% of fair market delta
  if (valueDelta !== 0) {
    const allowedVariance = Math.abs(valueDelta) * 0.25; // 25% threshold per Section 10
    const actualDeviation = Math.abs(cashAdjustment - valueDelta);
    
    if (actualDeviation > allowedVariance) {
      // Log rejected trade attempt for admin review
      console.error('[ANTI-WASH-TRADING] Trade rejected:', {
        timestamp: new Date().toISOString(),
        proposer_club_id: proposerClub.id,
        recipient_club_id: recipientClubId,
        offered_value: offeredValue,
        requested_value: requestedValue,
        value_delta: valueDelta,
        cash_adjustment: cashAdjustment,
        actual_deviation: actualDeviation,
        allowed_variance: allowedVariance,
        deviation_pct: ((actualDeviation / Math.abs(valueDelta)) * 100).toFixed(2) + '%',
        reason: 'Cash adjustment exceeds 25% variance from fair market value'
      });
      
      return { 
        error: `Cash adjustment deviates too much from fair market value (anti-wash-trading protection: deviation ${((actualDeviation / Math.abs(valueDelta)) * 100).toFixed(1)}% exceeds 25% threshold).` 
      };
    }
  }

  // 7. Create trade proposal
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: trade, error } = await supabase
      .from('p2p_trades')
      .insert({
        proposer_club_id: proposerClub.id,
        recipient_club_id: recipientClubId,
        offered_player_ids: offeredPlayerIds,
        requested_player_ids: requestedPlayerIds,
        cash_adjustment: cashAdjustment,
        status: 'PENDING',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      return { error: 'Failed to create trade proposal.' };
    }

    revalidatePath('/trades');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        trade_id: trade.id,
        expires_at: expiresAt,
      },
    };
  } catch {
    return { error: 'Failed to create trade proposal.' };
  }
}

export async function acceptTradeAction(tradeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to accept trades.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found.' };
  }

  const supabase = createClient();

  // 1. Fetch trade and validate
  const { data: trade, error: fetchError } = await supabase
    .from('p2p_trades')
    .select('*')
    .eq('id', tradeId)
    .single();

  if (fetchError || !trade) {
    return { error: 'Trade not found.' };
  }

  if (trade.status !== 'PENDING') {
    return { error: 'Trade is no longer pending.' };
  }

  if (trade.recipient_club_id !== club.id) {
    return { error: 'You are not the recipient of this trade.' };
  }

  if (new Date(trade.expires_at) < new Date()) {
    return { error: 'Trade has expired.' };
  }

  // 2. Try atomic Postgres RPC first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('accept_p2p_trade', {
      p_trade_id: tradeId,
    });
    
    if (!rpcError && rpcData) {
      revalidatePath('/trades');
      revalidatePath('/dashboard');
      return { success: true, data: rpcData };
    }
  } catch {
    // Fall through to manual execution
  }

  // 3. Manual execution (resilient fallback)
  const proposerRoster = await getClubRoster(trade.proposer_club_id);
  const recipientRoster = await getClubRoster(trade.recipient_club_id);

  // Validate players still exist in rosters
  const proposerPlayerIds = new Set(proposerRoster.map(r => r.player_id));
  const recipientPlayerIds = new Set(recipientRoster.map(r => r.player_id));

  for (const pid of trade.offered_player_ids) {
    if (!proposerPlayerIds.has(pid)) {
      return { error: 'Trade no longer valid: offered player no longer in proposer roster.' };
    }
  }

  for (const pid of trade.requested_player_ids) {
    if (!recipientPlayerIds.has(pid)) {
      return { error: 'Trade no longer valid: requested player no longer in recipient roster.' };
    }
  }

  // Get proposer club for purse update
  let proposerClub: any;
  try {
    const { data: pc } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', trade.proposer_club_id)
      .single();
    proposerClub = pc;
  } catch {
    return { error: 'Failed to fetch proposer club.' };
  }

  // Execute transfers
  const cashAdj = Number(trade.cash_adjustment);
  const proposerPurse = Number(proposerClub.virtual_purse_balance);
  const recipientPurse = Number(club.virtual_purse_balance);

  // Transfer players from proposer to recipient
  for (const pid of trade.offered_player_ids) {
    const player = SAMPLE_PLAYERS.find(p => p.id === pid) || 
                   proposerRoster.find(r => r.player_id === pid)?.player;
    if (player) {
      await removePlayerFromRoster(trade.proposer_club_id, pid);
      await addPlayerToRoster(trade.recipient_club_id, player);
    }
  }

  // Transfer players from recipient to proposer
  for (const pid of trade.requested_player_ids) {
    const player = SAMPLE_PLAYERS.find(p => p.id === pid) ||
                   recipientRoster.find(r => r.player_id === pid)?.player;
    if (player) {
      await removePlayerFromRoster(trade.recipient_club_id, pid);
      await addPlayerToRoster(trade.proposer_club_id, player);
    }
  }

  // Adjust purses
  if (cashAdj > 0) {
    // Proposer pays recipient
    await updateClubPurse(proposerClub.user_id, proposerPurse - cashAdj, 0);
    await updateClubPurse(user.id, recipientPurse + cashAdj, 0);
  } else if (cashAdj < 0) {
    // Recipient pays proposer
    await updateClubPurse(user.id, recipientPurse + cashAdj, 0);
    await updateClubPurse(proposerClub.user_id, proposerPurse - cashAdj, 0);
  }

  // Update trade status
  await supabase
    .from('p2p_trades')
    .update({ status: 'ACCEPTED', resolved_at: new Date().toISOString() })
    .eq('id', tradeId);

  revalidatePath('/trades');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: {
      action: 'trade_accepted',
      trade_id: tradeId,
    },
  };
}

export async function rejectTradeAction(tradeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to reject trades.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found.' };
  }

  const supabase = createClient();

  const { data: trade, error: fetchError } = await supabase
    .from('p2p_trades')
    .select('*')
    .eq('id', tradeId)
    .single();

  if (fetchError || !trade) {
    return { error: 'Trade not found.' };
  }

  if (trade.status !== 'PENDING') {
    return { error: 'Trade is no longer pending.' };
  }

  if (trade.recipient_club_id !== club.id) {
    return { error: 'You are not the recipient of this trade.' };
  }

  const { error: updateError } = await supabase
    .from('p2p_trades')
    .update({ status: 'REJECTED', resolved_at: new Date().toISOString() })
    .eq('id', tradeId);

  if (updateError) {
    return { error: 'Failed to reject trade.' };
  }

  revalidatePath('/trades');
  revalidatePath('/dashboard');

  return { success: true, data: { trade_id: tradeId } };
}

export async function cancelTradeAction(tradeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to cancel trades.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found.' };
  }

  const supabase = createClient();

  const { data: trade, error: fetchError } = await supabase
    .from('p2p_trades')
    .select('*')
    .eq('id', tradeId)
    .single();

  if (fetchError || !trade) {
    return { error: 'Trade not found.' };
  }

  if (trade.status !== 'PENDING') {
    return { error: 'Trade is no longer pending.' };
  }

  if (trade.proposer_club_id !== club.id) {
    return { error: 'You are not the proposer of this trade.' };
  }

  const { error: updateError } = await supabase
    .from('p2p_trades')
    .update({ status: 'CANCELLED', resolved_at: new Date().toISOString() })
    .eq('id', tradeId);

  if (updateError) {
    return { error: 'Failed to cancel trade.' };
  }

  revalidatePath('/trades');
  revalidatePath('/dashboard');

  return { success: true, data: { trade_id: tradeId } };
}

export async function getTradesForClub() {
  const user = await getCurrentUser();
  if (!user) {
    return { incoming: [], outgoing: [] };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { incoming: [], outgoing: [] };
  }

  const supabase = createClient();

  try {
    // Incoming trades (where this club is recipient)
    const { data: incoming } = await supabase
      .from('p2p_trades')
      .select('*')
      .eq('recipient_club_id', club.id)
      .in('status', ['PENDING'])
      .order('created_at', { ascending: false });

    // Outgoing: trades (where this club is proposer)
    const { data: outgoing } = await supabase
      .from('p2p_trades')
      .select('*')
      .eq('proposer_club_id', club.id)
      .in('status', ['PENDING'])
      .order('created_at', { ascending: false });

    return {
      incoming: incoming || [],
      outgoing: outgoing || [],
    };
  } catch {
    return { incoming: [], outgoing: [] };
  }
}
