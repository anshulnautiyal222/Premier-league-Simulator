'use server';

import { revalidatePath } from 'next/cache';
import {
  getCurrentUser,
  getClubForUser,
  getClubRoster,
  addPlayerToRoster,
  patchClubSession,
} from '@/lib/session';
import {
  type FacilityKey,
  FACILITY_META,
  upgradeCost,
  clampFacilityLevel,
  academyPackPrice,
  rollRarity,
  stadiumWeeklyIncome,
  top11SquadAppeal,
  isDividendDue,
} from '@/lib/facilities';
import { rookiesByRarity, type RookiePlayer } from '@/lib/data/rookies';
import { createClient } from '@/lib/supabase/server';

function revalidateFacilityPaths() {
  revalidatePath('/academy');
  revalidatePath('/dashboard');
  revalidatePath('/rumors');
}

export async function upgradeFacilityAction(facility: FacilityKey) {
  if (!FACILITY_META[facility]) {
    return { error: 'Unknown facility.' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to upgrade facilities.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found. Please found a club first.' };
  }

  const column = FACILITY_META[facility].column;
  const currentLevel = clampFacilityLevel(club[column]);
  const cost = upgradeCost(facility, currentLevel);

  if (cost == null) {
    return { error: `${FACILITY_META[facility].name} is already at maximum tier.` };
  }

  const purse = Number(club.virtual_purse_balance) || 0;
  if (purse < cost) {
    return {
      error: `Insufficient purse (£${purse.toLocaleString('en-GB')}) to upgrade ${FACILITY_META[facility].short} (£${cost.toLocaleString('en-GB')}).`,
    };
  }

  const supabase = createClient();
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('upgrade_facility', {
      p_facility: facility,
    });
    if (!rpcError && rpcData) {
      await patchClubSession(user.id, {
        virtual_purse_balance: Number(rpcData.new_purse ?? purse - cost),
        [column]: currentLevel + 1,
      });
      revalidateFacilityPaths();
      return {
        success: true,
        data: {
          facility,
          new_level: currentLevel + 1,
          cost,
          remaining_purse: Number(rpcData.new_purse ?? purse - cost),
        },
      };
    }
  } catch {
    // fall through
  }

  const newPurse = purse - cost;
  await patchClubSession(user.id, {
    virtual_purse_balance: newPurse,
    [column]: currentLevel + 1,
  });

  revalidateFacilityPaths();
  return {
    success: true,
    data: {
      facility,
      new_level: currentLevel + 1,
      cost,
      remaining_purse: newPurse,
    },
  };
}

export async function openAcademyPackAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to open academy packs.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found.' };
  }

  const academyLevel = clampFacilityLevel(club.academy_level);
  const price = academyPackPrice(academyLevel);
  const purse = Number(club.virtual_purse_balance) || 0;

  if (purse < price) {
    return { error: `Pack costs £${price.toLocaleString('en-GB')}. Insufficient purse.` };
  }

  const roster = await getClubRoster(club.id);
  if (roster.length >= 25) {
    return { error: 'Squad limit reached (maximum 25 players). Sell before promoting a rookie.' };
  }

  const owned = new Set(roster.map((r) => r.player_id));
  let pick: RookiePlayer | undefined;
  let rarity = rollRarity(academyLevel);

  for (let attempt = 0; attempt < 3; attempt++) {
    const pool = rookiesByRarity(rarity).filter((p) => !owned.has(p.id));
    if (pool.length > 0) {
      pick = pool[Math.floor(Math.random() * pool.length)];
      break;
    }
    rarity = rarity === 'wonderkid' ? 'rare' : 'common';
  }

  if (!pick) {
    const leftover = rookiesByRarity('common')
      .concat(rookiesByRarity('rare'), rookiesByRarity('wonderkid'))
      .filter((p) => !owned.has(p.id));
    pick = leftover[0];
  }

  if (!pick) {
    return { error: 'Academy pool exhausted — every rookie token is already on your books.' };
  }

  const minted = {
    ...pick,
    current_market_value: pick.current_market_value,
  };

  const newPurse = purse - price;
  const newSquadVal = Number(club.total_squad_value || 0) + minted.current_market_value;

  await addPlayerToRoster(club.id, minted);
  const supabase = createClient();
  try {
    await supabase.from('players').upsert({
      id: minted.id,
      name: minted.name,
      real_team: minted.real_team,
      position: minted.position,
      base_value: minted.base_value,
      current_market_value: minted.current_market_value,
      form_score: minted.form_score,
      injury_status: minted.injury_status,
      contract_months_remaining: minted.contract_months_remaining,
    });
  } catch {
    // ignore
  }
  await patchClubSession(user.id, {
    virtual_purse_balance: newPurse,
    total_squad_value: newSquadVal,
  });

  try {
    await supabase.from('market_transactions').insert({
      buyer_club_id: club.id,
      player_id: minted.id,
      fee: price,
      transaction_type: 'ACADEMY_MINT',
    });
  } catch {
    // ignore
  }

  revalidateFacilityPaths();
  return {
    success: true,
    data: {
      player: minted,
      rarity: pick.rarity,
      pack_price: price,
      remaining_purse: newPurse,
    },
  };
}

export async function claimStadiumDividendAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to collect stadium yield.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found.' };
  }

  if (!isDividendDue(club.last_dividend_at)) {
    return { error: 'Weekly commercial yield is not due yet.' };
  }

  const roster = await getClubRoster(club.id);
  const appeal = top11SquadAppeal(
    roster.map((r) => Number(r.player?.current_market_value || r.acquisition_price || 0))
  );
  const level = clampFacilityLevel(club.stadium_level);
  const payout = stadiumWeeklyIncome(appeal, level);
  const newPurse = Number(club.virtual_purse_balance || 0) + payout;
  const claimedAt = new Date().toISOString();

  const supabase = createClient();
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('claim_stadium_dividend', {
      p_payout: payout,
    });
    if (!rpcError && rpcData) {
      await patchClubSession(user.id, {
        virtual_purse_balance: Number(rpcData.new_purse ?? newPurse),
        last_dividend_at: rpcData.last_dividend_at ?? claimedAt,
      });
      revalidateFacilityPaths();
      return {
        success: true,
        data: {
          payout: Number(rpcData.payout ?? payout),
          remaining_purse: Number(rpcData.new_purse ?? newPurse),
          top11_appeal: appeal,
        },
      };
    }
  } catch {
    // fall through
  }

  await patchClubSession(user.id, {
    virtual_purse_balance: newPurse,
    last_dividend_at: claimedAt,
  });

  try {
    await supabase.from('market_transactions').insert({
      buyer_club_id: club.id,
      player_id: roster[0]?.player_id,
      fee: payout,
      transaction_type: 'DIVIDEND_PAYOUT',
    });
  } catch {
    // player_id is required on ledger — skip if empty roster
  }

  revalidateFacilityPaths();
  return {
    success: true,
    data: {
      payout,
      remaining_purse: newPurse,
      top11_appeal: appeal,
    },
  };
}
