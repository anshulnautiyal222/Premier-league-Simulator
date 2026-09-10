'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function buyPlayerAction(playerId: string) {
  if (!playerId) {
    return { error: 'Invalid player ID.' };
  }

  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be logged in to execute market transactions.' };
  }

  // Attempt atomic Postgres RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('buy_player', {
    p_player_id: playerId,
  });

  if (!rpcError) {
    revalidatePath('/market');
    revalidatePath('/dashboard');
    return { success: true, data: rpcData };
  }

  // Fallback if RPC is not yet loaded into the Supabase database instance:
  // Execute transactional sequence:
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id, virtual_purse_balance, total_squad_value')
    .eq('user_id', user.id)
    .single();

  if (clubError || !club) {
    return { error: 'Virtual club not found. Please found a club first.' };
  }

  // Check if player is already owned
  const { data: existingRoster } = await supabase
    .from('club_roster')
    .select('id')
    .eq('club_id', club.id)
    .eq('player_id', playerId)
    .maybeSingle();

  if (existingRoster) {
    return { error: 'Player is already in your club roster.' };
  }

  // Fetch player details
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, name, current_market_value')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    return { error: 'Player not found in catalog.' };
  }

  const purse = Number(club.virtual_purse_balance);
  const price = Number(player.current_market_value);

  if (purse < price) {
    return {
      error: `Insufficient purse balance (£${purse.toLocaleString()}) to purchase ${player.name} (£${price.toLocaleString()}).`,
    };
  }

  const newPurse = purse - price;
  const newSquadVal = Number(club.total_squad_value) + price;

  // 1. Deduct fee from club's purse
  const { error: updateClubError } = await supabase
    .from('clubs')
    .update({
      virtual_purse_balance: newPurse,
      total_squad_value: newSquadVal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', club.id);

  if (updateClubError) {
    return { error: `Transaction failed: ${updateClubError.message}` };
  }

  // 2. Insert into club_roster
  const { error: rosterError } = await supabase
    .from('club_roster')
    .insert({
      club_id: club.id,
      player_id: player.id,
      acquisition_price: price,
      acquired_at: new Date().toISOString(),
      in_starting_xi: false,
    });

  if (rosterError) {
    return { error: `Failed to assign player to roster: ${rosterError.message}` };
  }

  // 3. Insert into market_transactions audit trail
  await supabase
    .from('market_transactions')
    .insert({
      buyer_club_id: club.id,
      seller_club_id: null,
      player_id: player.id,
      fee: price,
      transaction_type: 'market_buy',
    });

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

  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be logged in to execute market liquidations.' };
  }

  // Attempt atomic Postgres RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('sell_player', {
    p_player_id: playerId,
  });

  if (!rpcError) {
    revalidatePath('/market');
    revalidatePath('/dashboard');
    return { success: true, data: rpcData };
  }

  // Fallback transactional sequence:
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id, virtual_purse_balance, total_squad_value')
    .eq('user_id', user.id)
    .single();

  if (clubError || !club) {
    return { error: 'Club record not found.' };
  }

  // Verify ownership in club_roster
  const { data: rosterEntry, error: rosterFetchError } = await supabase
    .from('club_roster')
    .select('id, acquisition_price')
    .eq('club_id', club.id)
    .eq('player_id', playerId)
    .single();

  if (rosterFetchError || !rosterEntry) {
    return { error: 'This player is not in your active squad.' };
  }

  // Fetch player current valuation
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, name, current_market_value')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    return { error: 'Player record not found.' };
  }

  const currentValue = Number(player.current_market_value);
  const brokerFee = Math.round(currentValue * 0.03 * 100) / 100; // 3% platform broker fee
  const netProceeds = currentValue - brokerFee;

  const currentPurse = Number(club.virtual_purse_balance);
  const newPurse = currentPurse + netProceeds;
  const newSquadVal = Math.max(0, Number(club.total_squad_value) - currentValue);

  // 1. Credit net proceeds to club's purse
  const { error: updatePurseError } = await supabase
    .from('clubs')
    .update({
      virtual_purse_balance: newPurse,
      total_squad_value: newSquadVal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', club.id);

  if (updatePurseError) {
    return { error: `Failed to update purse: ${updatePurseError.message}` };
  }

  // 2. Remove player card from roster
  const { error: deleteRosterError } = await supabase
    .from('club_roster')
    .delete()
    .eq('id', rosterEntry.id);

  if (deleteRosterError) {
    return { error: `Failed to remove player from roster: ${deleteRosterError.message}` };
  }

  // 3. Record transaction in market_transactions
  await supabase
    .from('market_transactions')
    .insert({
      buyer_club_id: null,
      seller_club_id: club.id,
      player_id: player.id,
      fee: netProceeds,
      transaction_type: 'market_sell',
    });

  revalidatePath('/market');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: {
      action: 'market_sell',
      player_name: player.name,
      gross_value: currentValue,
      broker_fee: brokerFee,
      net_proceeds: netProceeds,
      new_purse: newPurse,
    },
  };
}
