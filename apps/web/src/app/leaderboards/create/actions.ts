'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getClubForUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createLeagueAction(data: {
  name: string;
  budgetCap: number;
  salaryCap: number;
  maxMembers: number;
  isPublic: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to create a league.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found. Please found a club first.' };
  }

  const supabase = createClient();

  // Generate unique invite code (6-character alphanumeric)
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  let inviteCode = generateInviteCode();
  
  // Ensure unique invite code
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('private_leagues')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  try {
    const { data: league, error } = await supabase
      .from('private_leagues')
      .insert({
        owner_club_id: club.id,
        name: data.name,
        invite_code: inviteCode,
        budget_cap: data.budgetCap,
        salary_cap: data.salaryCap,
        max_members: data.maxMembers,
        is_public: data.isPublic,
        member_club_ids: [club.id],
      })
      .select()
      .single();

    if (error) {
      return { error: 'Failed to create league.' };
    }

    // Add owner as member
    await supabase
      .from('league_membership')
      .insert({
        league_id: league.id,
        club_id: club.id,
      });

    revalidatePath('/leaderboards');
    revalidatePath('/leaderboards/create');

    return {
      success: true,
      data: {
        league_id: league.id,
        invite_code: inviteCode,
      },
    };
  } catch {
    return { error: 'Failed to create league.' };
  }
}

export async function joinLeagueByCodeAction(inviteCode: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to join a league.' };
  }

  const club = await getClubForUser(user.id);
  if (!club) {
    return { error: 'Club not found. Please found a club first.' };
  }

  const supabase = createClient();

  try {
    // Find league by invite code
    const { data: league, error: leagueError } = await supabase
      .from('private_leagues')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (leagueError || !league) {
      return { error: 'Invalid invite code.' };
    }

    // Check if already a member
    if (league.member_club_ids?.includes(club.id)) {
      return { error: 'You are already a member of this league.' };
    }

    // Check max members
    if (league.member_club_ids?.length >= league.max_members) {
      return { error: 'League is full.' };
    }

    // Add club to league members
    const { error: updateError } = await supabase
      .from('private_leagues')
      .update({
        member_club_ids: [...(league.member_club_ids || []), club.id],
        updated_at: new Date().toISOString(),
      })
      .eq('id', league.id);

    if (updateError) {
      return { error: 'Failed to join league.' };
    }

    // Add membership record
    await supabase
      .from('league_membership')
      .insert({
        league_id: league.id,
        club_id: club.id,
      });

    revalidatePath('/leaderboards');

    return {
      success: true,
      data: {
        league_id: league.id,
        league_name: league.name,
      },
    };
  } catch {
    return { error: 'Failed to join league.' };
  }
}
