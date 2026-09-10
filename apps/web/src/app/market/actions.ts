'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  getCurrentUser, 
  getClubForUser, 
  getClubRoster,
  addPlayerToRoster, 
  removePlayerFromRoster, 
  updateClubPurse 
} from '@/lib/session';
import { SAMPLE_PLAYERS } from '@/lib/data/players';
import { revalidatePath } from 'next/cache';

export async function buyPlayerAction(playerId: string) {
  if (!playerId) {
    return { error: 'Invalid player ID.' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to execute market transactions.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Virtual club not found. Please found a club first.' };
  }

  // 1. Attempt atomic Postgres RPC first if connected to real Supabase
  const supabase = createClient();
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('buy_player', {
      p_player_id: playerId,
    });
    if (!rpcError && rpcData) {
      revalidatePath('/market');
      revalidatePath('/dashboard');
      return { success: true, data: rpcData };
    }
  } catch {
    // Fall through to resilient handler
  }

  // 2. Resilient session handler
  const roster = await getClubRoster(club.id);
  if (roster.length >= 25) {
    return { error: 'Squad limit reached (maximum 25 players).' };
  }

  if (roster.some((r) => r.player_id === playerId)) {
    return { error: 'Player is already in your club roster.' };
  }

  // Find player
  const player = SAMPLE_PLAYERS.find((p) => p.id === playerId);
  if (!player) {
    return { error: 'Player not found in catalog.' };
  }

  const currentPurse = Number(club.virtual_purse_balance);
  const price = Number(player.current_market_value);

  if (currentPurse < price) {
    return {
      error: `Insufficient purse balance (£${currentPurse.toLocaleString()}) to purchase ${player.name} (£${price.toLocaleString()}).`,
    };
  }

  const newPurse = currentPurse - price;
  const newSquadVal = Number(club.total_squad_value) + price;

  await addPlayerToRoster(club.id, player);
  await updateClubPurse(user.id, newPurse, newSquadVal);

  revalidatePath('/market');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: {
      action: 'market_buy',
      player_name: player.name,
      fee: price,
      remaining_purse: newPurse,
    },
  };
}

export async function sellPlayerAction(playerId: string) {
  if (!playerId) {
    return { error: 'Invalid player ID.' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to execute market liquidations.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club record not found.' };
  }

  // 1. Attempt atomic Postgres RPC first
  const supabase = createClient();
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('sell_player', {
      p_player_id: playerId,
    });
    if (!rpcError && rpcData) {
      revalidatePath('/market');
      revalidatePath('/dashboard');
      return { success: true, data: rpcData };
    }
  } catch {
    // Fall through to resilient handler
  }

  // 2. Resilient session handler
  const roster = await getClubRoster(club.id);
  const rosterEntry = roster.find((r) => r.player_id === playerId);

  if (!rosterEntry) {
    return { error: 'This player is not in your active squad.' };
  }

  const player = rosterEntry.player || SAMPLE_PLAYERS.find((p) => p.id === playerId);
  const currentValue = Number(player?.current_market_value || rosterEntry.acquisition_price);
  const brokerFee = Math.round(currentValue * 0.03 * 100) / 100; // 3% broker fee
  const netProceeds = currentValue - brokerFee;

  const currentPurse = Number(club.virtual_purse_balance);
  const newPurse = currentPurse + netProceeds;
  const newSquadVal = Math.max(0, Number(club.total_squad_value) - currentValue);

  await removePlayerFromRoster(club.id, playerId);
  await updateClubPurse(user.id, newPurse, newSquadVal);

  revalidatePath('/market');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: {
      action: 'market_sell',
      player_name: player?.name || 'Player',
      gross_value: currentValue,
      broker_fee: brokerFee,
      net_proceeds: netProceeds,
      new_purse: newPurse,
    },
  };
}
