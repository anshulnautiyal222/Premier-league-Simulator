'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function foundClub(formData: FormData) {
  const supabase = createClient();

  // Verify authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user already founded a club
  const { data: existingClub } = await supabase
    .from('clubs')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

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
  const { error: insertError } = await supabase
    .from('clubs')
    .insert({
      user_id: user.id,
      club_name: clubName,
      badge_url: badgeUrl,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
      },
      home_ground_name: homeGroundName,
      virtual_purse_balance: 100000000.00, // £100M virtual funds
      total_squad_value: 0.00,
      academy_level: 1,
      scouting_level: 1,
      stadium_level: 1,
    });

  if (insertError) {
    return { error: `Failed to found club: ${insertError.message}` };
  }

  redirect('/dashboard');
}
