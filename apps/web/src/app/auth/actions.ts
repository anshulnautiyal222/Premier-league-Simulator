'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // If session is immediately available (e.g. email confirmation disabled), go to found-club
  if (data.session) {
    redirect('/found-club');
  }

  // If email confirmation is required:
  return { 
    success: true, 
    message: 'Account created! Please check your email to confirm, or log in.' 
  };
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Check if club already exists for this user
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

  redirect('/found-club');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
