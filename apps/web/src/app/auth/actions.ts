'use server';

import { createClient } from '@/lib/supabase/server';
import { setDemoUserSession, clearUserSession, getClubForUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData): Promise<{ error?: string; message?: string } | void> {
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = createClient();
  let signedInViaSupabase = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data?.user) {
      signedInViaSupabase = true;
      if (data.session) {
        redirect('/found-club');
      }
    }
  } catch {
    // Supabase unavailable / unconfigured
  }

  // Fallback / local development session
  const user = await setDemoUserSession(email);
  const existingClub = await getClubForUser(user.id);

  if (existingClub) {
    redirect('/dashboard');
  } else {
    redirect('/found-club');
  }
}

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      const { data: club } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (club) {
        redirect('/dashboard');
      } else {
        redirect('/found-club');
      }
    }
  } catch {
    // Supabase unavailable / unconfigured
  }

  // Fallback to local session
  const user = await setDemoUserSession(email);
  const existingClub = await getClubForUser(user.id);

  if (existingClub) {
    redirect('/dashboard');
  } else {
    redirect('/found-club');
  }
}

export async function signInDemo() {
  const demoEmail = 'gaffer.director@pl-gafferdex.com';
  const user = await setDemoUserSession(demoEmail);
  const existingClub = await getClubForUser(user.id);

  if (existingClub) {
    redirect('/dashboard');
  } else {
    redirect('/found-club');
  }
}

export async function signOut() {
  await clearUserSession();
  redirect('/auth/login');
}
