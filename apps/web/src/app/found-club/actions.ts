'use server';

import { getCurrentUser, getClubForUser, saveClubSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function foundClub(formData: FormData) {
  // Verify authenticated user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user already founded a club
  const existingClub = await getClubForUser(user.id);
  if (existingClub) {
    redirect('/dashboard');
  }

  // Extract form inputs
  const clubName = (formData.get('club_name') as string)?.trim();
  const badgeUrl = (formData.get('badge_url') as string)?.trim() || 'preset_lion';
  const primaryColor = (formData.get('primary_color') as string)?.trim() || '#00FF87';
  const secondaryColor = (formData.get('secondary_color') as string)?.trim() || '#0A0E17';
  const homeGroundName = (formData.get('home_ground_name') as string)?.trim() || 'Home Arena';

  if (!clubName || clubName.length < 3) {
    return { error: 'Club name must be at least 3 characters long.' };
  }

  if (clubName.length > 64) {
    return { error: 'Club name cannot exceed 64 characters.' };
  }

  // Insert club with £100M starting demo purse (£100,000,000)
  try {
    await saveClubSession({
      user_id: user.id,
      club_name: clubName,
      badge_url: badgeUrl,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
      },
      home_ground_name: homeGroundName,
      virtual_purse_balance: 100000000.00, // £100M starting virtual purse
      draft_credits: 500,
      championCoins: 0,
      league_id: '00000000-0000-0000-0000-000000000001',
      total_squad_value: 0.00,
      academy_level: 1,
      scouting_level: 1,
      stadium_level: 1,
      last_dividend_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    return { error: `Failed to found club: ${err.message}` };
  }

  redirect('/dashboard');
}
