'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000';
const VOTED_COOKIE_NAME = 'gafferdex_voted_rumors';

export interface VoteResult {
  rumor_id: string;
  vote: string;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  deal_percentage: number;
  delusion_percentage: number;
  rumor_multiplier: number;
  rumor_multiplier_pct: string;
  impact_summary: string;
}

export async function getVotedRumorIds(): Promise<Record<string, 'deal' | 'delusion'>> {
  const cookieStore = cookies();
  const raw = cookieStore.get(VOTED_COOKIE_NAME)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function voteRumorAction(
  rumorId: string,
  vote: 'deal' | 'delusion'
): Promise<{ success: boolean; data?: VoteResult; error?: string }> {
  try {
    // 1. Send vote to FastAPI backend
    const res = await fetch(`${API_BASE_URL}/api/v1/rumors/${rumorId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
      cache: 'no-store',
    });

    let voteData: VoteResult;

    if (res.ok) {
      voteData = await res.json();
    } else {
      // Fallback calculation for offline demo
      voteData = {
        rumor_id: rumorId,
        vote,
        upvotes: vote === 'deal' ? 1 : 0,
        downvotes: vote === 'delusion' ? 1 : 0,
        total_votes: 1,
        deal_percentage: vote === 'deal' ? 100.0 : 0.0,
        delusion_percentage: vote === 'delusion' ? 100.0 : 0.0,
        rumor_multiplier: vote === 'deal' ? 0.20 : 0.05,
        rumor_multiplier_pct: vote === 'deal' ? '+20.0%' : '+5.0%',
        impact_summary: `Vote recorded (${vote.toUpperCase()})! Local simulation updated.`,
      };
    }

    // 2. Persist in cookies so the user cannot vote twice in the session
    const cookieStore = cookies();
    const existing = await getVotedRumorIds();
    existing[rumorId] = vote;

    cookieStore.set(VOTED_COOKIE_NAME, JSON.stringify(existing), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    revalidatePath('/rumors');
    return { success: true, data: voteData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit vote' };
  }
}

export async function submitRumorAction(formData: FormData) {
  try {
    const player_id = formData.get('player_id') as string;
    const source_name = (formData.get('source_name') as string)?.trim();
    const tier_rating = parseInt(formData.get('tier_rating') as string, 10);
    const buying_club = (formData.get('buying_club') as string)?.trim();
    const fee_raw = formData.get('fee_estimate') as string;
    const fee_estimate = fee_raw ? parseFloat(fee_raw) : undefined;
    const headline = (formData.get('headline') as string)?.trim() || undefined;

    if (!player_id || !source_name || !tier_rating || !buying_club) {
      return { success: false, error: 'Please complete all required fields.' };
    }

    const payload = {
      player_id,
      source_name,
      tier_rating,
      buying_club,
      fee_estimate,
      headline,
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/rumors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.detail || 'Backend rejected rumor ingestion.' };
    }

    const newRumor = await res.json();
    revalidatePath('/rumors');
    return { success: true, data: newRumor };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to ingest rumor.' };
  }
}
